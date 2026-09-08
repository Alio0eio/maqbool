import { Router, type IRouter } from "express";
import {
  loginRequestSchema,
  refreshRequestSchema,
  registerRequestSchema,
} from "@workspace/api-zod/auth";
import { db, users } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  generateAccessToken,
  generateRefreshToken,
  hashPassword,
  verifyPassword,
  verifyRefreshToken,
} from "../lib/auth";
import { authenticate } from "../middlewares/auth";
import { revokeAccessToken } from "../lib/token-revocation";
import {
  getRefreshToken,
  revokeRefreshToken,
  revokeRefreshTokensForUser,
  storeRefreshToken,
} from "../lib/refresh-token-store";

type HttpError = Error & { statusCode: number };

function createHttpError(message: string, statusCode: number): HttpError {
  const error = new Error(message) as HttpError;
  error.statusCode = statusCode;
  return error;
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

export function createAuthRouter(database: typeof db = db): IRouter {
  const router: IRouter = Router();

  router.post("/auth/login", async (req, res, next) => {
    const parsed = loginRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      next(createHttpError("Invalid login data", 400));
      return;
    }

    const email = parsed.data.email.toLowerCase();
    const { password } = parsed.data;

    try {
      const [user] = await database
        .select({
          id: users.id,
          email: users.email,
          passwordHash: users.passwordHash,
          name: users.name,
          role: users.role,
        })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (!user || !(await verifyPassword(password, user.passwordHash))) {
        next(createHttpError("Invalid email or password", 401));
        return;
      }

      const accessToken = generateAccessToken(user.id, {
        role: user.role,
        email: user.email,
        name: user.name,
      });
      const refreshToken = generateRefreshToken(user.id);
      const refreshPayload = verifyRefreshToken(refreshToken);
      storeRefreshToken(refreshPayload.jti, String(user.id), refreshPayload.exp * 1000);

      res.status(200).json({
        message: "Login successful",
        token: accessToken,
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/auth/logout", authenticate, (req, res, next) => {
    if (!req.authToken) {
      next(createHttpError("Invalid authentication token", 401));
      return;
    }

    revokeAccessToken(req.authToken.jti, req.authToken.exp * 1000);
    revokeRefreshTokensForUser(req.user?.id ?? req.authToken.sub);
    res.status(200).json({ message: "Logout successful" });
  });

  router.post("/auth/refresh", async (req, res, next) => {
    const parsed = refreshRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      next(createHttpError("Invalid refresh token", 401));
      return;
    }

    try {
      const refreshPayload = verifyRefreshToken(parsed.data.refreshToken);
      const storedToken = getRefreshToken(refreshPayload.jti);

      if (
        !storedToken ||
        storedToken.revoked ||
        storedToken.userId !== refreshPayload.sub ||
        storedToken.expiresAt <= Date.now()
      ) {
        if (storedToken?.revoked) {
          revokeRefreshTokensForUser(storedToken.userId);
        }
        next(createHttpError("Invalid refresh token", 401));
        return;
      }

      const [user] = await database
        .select({ id: users.id, email: users.email, name: users.name, role: users.role })
        .from(users)
        .where(eq(users.id, Number(refreshPayload.sub)))
        .limit(1);

      if (!user) {
        revokeRefreshToken(refreshPayload.jti);
        next(createHttpError("Invalid refresh token", 401));
        return;
      }

      revokeRefreshToken(refreshPayload.jti);
      const accessToken = generateAccessToken(user.id, {
        role: user.role,
        email: user.email,
        name: user.name,
      });
      const refreshToken = generateRefreshToken(user.id);
      const nextRefreshPayload = verifyRefreshToken(refreshToken);
      storeRefreshToken(
        nextRefreshPayload.jti,
        String(user.id),
        nextRefreshPayload.exp * 1000,
      );

      res.status(200).json({
        message: "Token refreshed successfully",
        accessToken,
        refreshToken,
      });
    } catch (_error) {
      next(createHttpError("Invalid refresh token", 401));
    }
  });

  router.post("/auth/register", async (req, res, next) => {
    const parsed = registerRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      next(createHttpError("Invalid registration data", 400));
      return;
    }

    const email = parsed.data.email.toLowerCase();
    const { password, name } = parsed.data;

    try {
      const existingUser = await database
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existingUser.length > 0) {
        next(createHttpError("An account with that email already exists", 409));
        return;
      }

      const passwordHash = await hashPassword(password);
      const [user] = await database
        .insert(users)
        .values({
          email,
          passwordHash,
          role: "candidate",
          name,
        })
        .returning({ id: users.id, email: users.email, name: users.name });

      res.status(201).json({
        message: "User registered successfully",
        user,
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        next(createHttpError("An account with that email already exists", 409));
        return;
      }

      next(createHttpError("Registration failed", 500));
    }
  });

  return router;
}

const router = createAuthRouter();

export default router;
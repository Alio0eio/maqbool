import { Router, type IRouter } from "express";
import { registerRequestSchema } from "@workspace/api-zod/auth";
import { db, users } from "@workspace/db";
import { eq } from "drizzle-orm";
import { hashPassword } from "../lib/auth";

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
import type { RequestHandler } from "express";
import jwt, { type Algorithm, type JwtPayload } from "jsonwebtoken";
import { config } from "../config";

export const userRoles = ["candidate", "recruiter", "admin"] as const;
export type UserRole = (typeof userRoles)[number];

export type AuthenticatedUser = {
  id: string;
  role: UserRole;
  email?: string;
  name?: string;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

function createAuthError(message: string): Error & { statusCode: number } {
  const error = new Error(message) as Error & { statusCode: number };
  error.statusCode = 401;
  return error;
}

function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && userRoles.includes(value as UserRole);
}

function getAuthenticatedUser(payload: string | JwtPayload): AuthenticatedUser {
  if (
    typeof payload === "string" ||
    typeof payload.sub !== "string" ||
    !payload.sub ||
    !isUserRole(payload.role)
  ) {
    throw createAuthError("Invalid authentication token");
  }

  return {
    id: payload.sub,
    role: payload.role,
    ...(typeof payload.email === "string" ? { email: payload.email } : {}),
    ...(typeof payload.name === "string" ? { name: payload.name } : {}),
  };
}

export const authenticate: RequestHandler = (req, _res, next) => {
  const authorization = req.get("authorization");
  if (!authorization) {
    next(createAuthError("Authentication required"));
    return;
  }

  const match = authorization.match(/^Bearer\s+([^\s]+)$/i);
  if (!match) {
    next(createAuthError("Invalid authentication credentials"));
    return;
  }

  try {
    const payload = jwt.verify(match[1], config.jwt.accessSecret, {
      algorithms: [config.jwt.algorithm],
    });
    req.user = getAuthenticatedUser(payload);
    next();
  } catch (error) {
    if (error instanceof Error && "statusCode" in error) {
      next(error);
      return;
    }

    next(createAuthError("Invalid authentication token"));
  }
};

export function authorize(...roles: UserRole[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) {
      next(createAuthError("Authentication required"));
      return;
    }

    if (!roles.includes(req.user.role)) {
      const error = new Error("Insufficient permissions") as Error & {
        statusCode: number;
      };
      error.statusCode = 403;
      next(error);
      return;
    }

    next();
  };
}
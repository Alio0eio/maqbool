import bcrypt from "bcryptjs";
import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";
import { config } from "../config";

const passwordSaltRounds = 12;

type AuthTokenPayload = JwtPayload & {
  sub: string;
};

type AuthError = Error & {
  statusCode: number;
};

function createTokenError(): AuthError {
  const error = new Error("Invalid or expired authentication token") as AuthError;
  error.statusCode = 401;
  return error;
}

function getTokenPayload(token: string, secret: string): AuthTokenPayload {
  try {
    const payload = jwt.verify(token, secret, {
      algorithms: [config.jwt.algorithm],
    });

    if (
      typeof payload === "string" ||
      typeof payload.sub !== "string" ||
      payload.sub.length === 0
    ) {
      throw createTokenError();
    }

    return payload as AuthTokenPayload;
  } catch (error) {
    if (error instanceof Error && "statusCode" in error) {
      throw error;
    }

    throw createTokenError();
  }
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, passwordSaltRounds);
}

export function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

export function generateAccessToken(userId: string | number): string {
  return jwt.sign(
    { sub: String(userId) },
    config.jwt.accessSecret,
    tokenOptions(config.jwt.accessExpiresIn),
  );
}

export function verifyAccessToken(token: string): AuthTokenPayload {
  return getTokenPayload(token, config.jwt.accessSecret);
}

export function generateRefreshToken(userId: string | number): string {
  return jwt.sign(
    { sub: String(userId) },
    config.jwt.refreshSecret,
    tokenOptions(config.jwt.refreshExpiresIn),
  );
}

export function verifyRefreshToken(token: string): AuthTokenPayload {
  return getTokenPayload(token, config.jwt.refreshSecret);
}

function tokenOptions(expiresIn: string): SignOptions {
  return {
    algorithm: config.jwt.algorithm,
    expiresIn: expiresIn as SignOptions["expiresIn"],
  };
}

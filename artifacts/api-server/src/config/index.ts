import "dotenv/config";
import type { Algorithm } from "jsonwebtoken";
import type { Level } from "pino";

const nodeEnvironments = ["development", "production", "test"] as const;
const jwtAlgorithms: Algorithm[] = ["HS256", "HS384", "HS512"];
const logLevels: Level[] = ["fatal", "error", "warn", "info", "debug", "trace"];

export type NodeEnvironment = (typeof nodeEnvironments)[number];

function requiredEnvironment(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function parsePort(value: string): number {
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535");
  }

  return port;
}

function parseNodeEnvironment(value: string): NodeEnvironment {
  if (!nodeEnvironments.includes(value as NodeEnvironment)) {
    throw new Error("NODE_ENV must be development, production, or test");
  }

  return value as NodeEnvironment;
}

const environment = parseNodeEnvironment(process.env.NODE_ENV?.trim() || "development");
const port = parsePort(requiredEnvironment("PORT"));
const legacyJwtSecret = process.env.JWT_SECRET?.trim();
const defaultTestJwtSecret = "test-only-jwt-secret-not-for-production";
const jwtSecret = legacyJwtSecret || (environment === "test" ? defaultTestJwtSecret : undefined);

const configuredJwtAlgorithm = process.env.JWT_ALGORITHM?.trim() || "HS256";
if (!jwtAlgorithms.includes(configuredJwtAlgorithm as Algorithm)) {
  throw new Error("JWT_ALGORITHM must be HS256, HS384, or HS512");
}

const configuredLogLevel =
  process.env.LOG_LEVEL?.trim() ||
  (environment === "development" ? "debug" : "info");
if (!logLevels.includes(configuredLogLevel as Level)) {
  throw new Error("LOG_LEVEL must be a valid Pino log level");
}

const jwtAccessSecret = process.env.JWT_ACCESS_SECRET?.trim() || jwtSecret;
const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET?.trim() || jwtSecret;
const jwtAccessExpiresIn = process.env.JWT_ACCESS_EXPIRES_IN?.trim() || "15m";
const jwtRefreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN?.trim() || "7d";

if (!jwtAccessSecret) {
  throw new Error("Missing required environment variable: JWT_ACCESS_SECRET or JWT_SECRET");
}

if (!jwtRefreshSecret) {
  throw new Error("Missing required environment variable: JWT_REFRESH_SECRET or JWT_SECRET");
}

if (environment === "production" && (jwtAccessSecret.length < 32 || jwtRefreshSecret.length < 32)) {
  throw new Error("JWT access and refresh secrets must be at least 32 characters in production");
}

const corsOrigins = (process.env.CORS_ORIGIN ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export const config = {
  env: environment,
  isProduction: environment === "production",
  port,
  corsOrigins,
  logLevel: configuredLogLevel as Level,
  databaseUrl: process.env.DATABASE_URL?.trim(),
  jwt: {
    secret: jwtAccessSecret,
    accessSecret: jwtAccessSecret,
    refreshSecret: jwtRefreshSecret,
    accessExpiresIn: jwtAccessExpiresIn,
    refreshExpiresIn: jwtRefreshExpiresIn,
    algorithm: configuredJwtAlgorithm as Algorithm,
  },
} as const;
import type { ErrorRequestHandler, RequestHandler } from "express";
import { config } from "../config";

type HttpError = Error & {
  status?: number;
  statusCode?: number;
  type?: string;
};

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({
    error: {
      message: "Route not found",
      method: req.method,
      path: req.originalUrl,
    },
  });
};

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  const httpError = error as HttpError;
  const isMalformedJson = httpError.type === "entity.parse.failed";
  const statusCode = isMalformedJson
    ? 400
    : httpError.statusCode ?? httpError.status ?? 500;
  const safeStatusCode = statusCode >= 400 && statusCode < 600 ? statusCode : 500;
  if (safeStatusCode >= 500) {
    req.log.error({ err: error }, "Unhandled request error");
  }

  res.status(safeStatusCode).json({
    error: {
      message: isMalformedJson
        ? "Malformed JSON request body"
        : safeStatusCode >= 500 && config.isProduction
          ? "Internal server error"
          : httpError.message || "Request failed",
    },
  });
};
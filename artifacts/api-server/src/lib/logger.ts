import pino from "pino";
import { config } from "../config";

export const logger = pino({
  level: config.logLevel,
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: [
    "req.headers.authorization",
    "req.headers.cookie",
    "res.headers.set-cookie",
  ],
  ...(config.isProduction
    ? {}
    : {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
            singleLine: true,
          },
        },
      }),
});

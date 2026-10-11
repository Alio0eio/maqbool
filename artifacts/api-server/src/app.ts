import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import path from "node:path";
import router from "./routes";
import { config } from "./config";
import { logger } from "./lib/logger";
import { errorHandler, notFoundHandler } from "./middlewares/error";

const app: Express = express();
const frontendDirectory = path.resolve(process.cwd(), "../maqbool/dist/public");
const frontendIndex = path.join(frontendDirectory, "index.html");

app.use(
  cors(
    config.corsOrigins.length
      ? { origin: config.corsOrigins, credentials: true }
      : undefined,
  ),
);
app.use(express.json());
app.use(cookieParser());
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
            path: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);
app.use(express.static(frontendDirectory));
app.get("/{*path}", (req, res, next) => {
  if (req.path === "/api" || req.path.startsWith("/api/")) {
    next();
    return;
  }

  res.sendFile(frontendIndex, (error) => {
    if (error) next(error);
  });
});
app.use(notFoundHandler);
app.use(errorHandler);

export default app;

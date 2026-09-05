import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes";
import { config } from "./config";
import { logger } from "./lib/logger";
import { errorHandler, notFoundHandler } from "./middlewares/error";

const app: Express = express();

app.use(
  cors(config.corsOrigins.length ? { origin: config.corsOrigins } : undefined),
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
app.use(notFoundHandler);
app.use(errorHandler);

export default app;

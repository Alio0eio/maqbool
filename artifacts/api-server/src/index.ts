import app from "./app";
import { config } from "./config";
import { logger } from "./lib/logger";

app.listen(config.port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port: config.port }, "Server listening");
});

import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./lib/logger";

const app = createApp();

app.listen(env.PORT, "0.0.0.0", () => {
  logger.info(`TrueNorth API server running on http://0.0.0.0:${env.PORT} (LAN accessible) in ${env.NODE_ENV} mode`);
});

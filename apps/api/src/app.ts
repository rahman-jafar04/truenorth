import express from "express";
import cors from "cors";
import helmet from "helmet";
import { privacyLoggingMiddleware } from "./middleware/privacy";
import { errorHandler } from "./middleware/errorHandler";
import { apiRouter } from "./routes";

export function createApp(): express.Application {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(privacyLoggingMiddleware);

  // Mount API endpoints
  app.use("/api", apiRouter);

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({
      error: {
        code: "NOT_FOUND",
        message: "Endpoint not found"
      }
    });
  });

  // Centralized error handler
  app.use(errorHandler);

  return app;
}

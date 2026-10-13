import { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger";

/**
 * Privacy middleware that logs HTTP requests while strictly excluding thought text
 * and private personal reflections.
 */
export function privacyLoggingMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  const isThoughtRoute = req.originalUrl.includes("/thoughts");

  res.on("finish", () => {
    const duration = Date.now() - start;
    const meta: Record<string, unknown> = {
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs: duration
    };

    if (isThoughtRoute) {
      meta.body = "[PRIVATE_THOUGHT_REDACTED]";
    } else if (req.body && Object.keys(req.body).length > 0) {
      meta.body = logger.sanitize(req.body);
    }

    logger.info(`HTTP ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`, meta);
  });

  next();
}

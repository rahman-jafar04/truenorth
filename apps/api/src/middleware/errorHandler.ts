import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { logger } from "../lib/logger";

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: unknown;
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  logger.error(`Unhandled error at ${req.method} ${req.url}: ${err.message}`, {
    stack: err.stack,
    details: err.details
  });

  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid request payload",
        details: err.errors.map((e) => ({
          path: e.path.join("."),
          message: e.message
        }))
      }
    });
    return;
  }

  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 && process.env.NODE_ENV === "production"
    ? "Internal server error"
    : err.message || "An unexpected error occurred";

  res.status(statusCode).json({
    error: {
      code: err.code || "INTERNAL_ERROR",
      message,
      ...(err.details ? { details: err.details } : {})
    }
  });
}

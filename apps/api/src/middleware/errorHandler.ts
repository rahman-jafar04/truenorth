import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { logger } from "../lib/logger";

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: unknown;
  errors?: Array<{ path: (string | number)[]; message: string }>;
  issues?: Array<{ path: (string | number)[]; message: string }>;
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  // Check for Zod error across different package instances
  const isZod =
    err instanceof ZodError ||
    err.name === "ZodError" ||
    Array.isArray(err.errors) ||
    Array.isArray(err.issues);

  if (isZod) {
    const issues = err.errors || err.issues || [];
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid request payload",
        details: issues.map((e) => ({
          path: Array.isArray(e.path) ? e.path.join(".") : String(e.path),
          message: e.message
        }))
      }
    });
    return;
  }

  const statusCode = err.statusCode || 500;
  const message =
    statusCode === 500 && process.env.NODE_ENV === "production"
      ? "Internal server error"
      : err.message || "An unexpected error occurred";

  logger.error(`Error at ${req.method} ${req.url} (${statusCode}): ${message}`, {
    code: err.code,
    details: err.details
  });

  res.status(statusCode).json({
    error: {
      code: err.code || "INTERNAL_ERROR",
      message,
      ...(err.details ? { details: err.details } : {})
    }
  });
}

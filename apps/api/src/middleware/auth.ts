import { Request, Response, NextFunction } from "express";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import { env } from "../config/env";
import { logger } from "../lib/logger";

export interface AuthenticatedUser {
  id: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  // Test environment bypass hook for automated testing
  if (env.NODE_ENV === "test" && req.headers["x-test-user-id"]) {
    req.user = {
      id: String(req.headers["x-test-user-id"]),
      email: String(req.headers["x-test-user-email"] || "test@example.com")
    };
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      error: {
        code: "UNAUTHORIZED",
        message: "Authorization header with Bearer token is required."
      }
    });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !data.user) {
      logger.warn("Token verification failed", { error: error?.message });
      res.status(401).json({
        error: {
          code: "INVALID_TOKEN",
          message: "The provided access token is expired or invalid."
        }
      });
      return;
    }

    req.user = {
      id: data.user.id,
      email: data.user.email ?? ""
    };

    next();
  } catch (err) {
    logger.error("Unexpected error in auth verification", err);
    res.status(500).json({
      error: {
        code: "AUTH_VERIFICATION_ERROR",
        message: "Failed to authenticate request."
      }
    });
  }
}

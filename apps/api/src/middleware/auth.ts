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
    if (env.NODE_ENV === "development" && env.SUPABASE_SERVICE_ROLE_KEY.includes("placeholder")) {
      req.user = {
        id: "00000000-0000-0000-0000-000000000001",
        email: "demo@truenorth.app"
      };
      return next();
    }
    res.status(401).json({
      error: {
        code: "UNAUTHORIZED",
        message: "Authorization header with Bearer token is required."
      }
    });
    return;
  }

  const token = authHeader.split(" ")[1];

  // Support mock dev tokens when running in development mode with placeholder Supabase
  if (
    token.startsWith("mock-token-") ||
    (env.NODE_ENV === "development" && env.SUPABASE_SERVICE_ROLE_KEY.includes("placeholder"))
  ) {
    const rawId = token.startsWith("mock-token-")
      ? token.replace("mock-token-", "")
      : "00000000-0000-0000-0000-000000000001";
    const userId = rawId.length === 36 ? rawId : "00000000-0000-0000-0000-000000000001";
    req.user = {
      id: userId,
      email: `${rawId}@truenorth.local`
    };
    return next();
  }

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

/**
 * Privacy-preserving logger
 * Explicitly redacts thoughts content, authorization headers, and sensitive fields.
 */

type LogLevel = "info" | "warn" | "error" | "debug";

const SENSITIVE_KEYS = new Set([
  "rawContent",
  "content",
  "thought",
  "thoughts",
  "password",
  "authorization",
  "token",
  "apiKey",
  "llm_api_key",
  "serviceRoleKey"
]);

function sanitize(data: unknown): unknown {
  if (!data || typeof data !== "object") {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitize(item));
  }

  const sanitizedObj: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      sanitizedObj[key] = "[REDACTED_FOR_PRIVACY]";
    } else if (typeof value === "object" && value !== null) {
      sanitizedObj[key] = sanitize(value);
    } else {
      sanitizedObj[key] = value;
    }
  }
  return sanitizedObj;
}

function logMessage(level: LogLevel, message: string, meta?: unknown) {
  const timestamp = new Date().toISOString();
  const safeMeta = meta !== undefined ? sanitize(meta) : "";

  const prefix = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  if (safeMeta !== "") {
    console[level === "debug" ? "log" : level](prefix, safeMeta);
  } else {
    console[level === "debug" ? "log" : level](prefix);
  }
}

export const logger = {
  info: (msg: string, meta?: unknown) => logMessage("info", msg, meta),
  warn: (msg: string, meta?: unknown) => logMessage("warn", msg, meta),
  error: (msg: string, meta?: unknown) => logMessage("error", msg, meta),
  debug: (msg: string, meta?: unknown) => logMessage("debug", msg, meta),
  sanitize
};

import { randomUUID } from "node:crypto";

type LogLevel = "info" | "warn" | "error";

type LogContext = {
  requestId?: string;
  userId?: string;
  route?: string;
  operation?: string;
  durationMs?: number;
  [key: string]: unknown;
};

function sanitize(value: unknown): unknown {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack:
        process.env.NODE_ENV === "production"
          ? undefined
          : value.stack,
    };
  }

  if (typeof value === "object" && value !== null) {
    if (Array.isArray(value)) {
      return value.map(sanitize);
    }

    const result: Record<string, unknown> = {};

    for (const [key, item] of Object.entries(value)) {
      const normalized = key.toLowerCase();

      if (
        normalized.includes("password") ||
        normalized.includes("token") ||
        normalized.includes("secret") ||
        normalized.includes("authorization") ||
        normalized.includes("cookie") ||
        normalized.includes("apikey") ||
        normalized.includes("api_key") ||
        normalized.includes("accesskey") ||
        normalized.includes("privatekey")
      ) {
        result[key] = "[REDACTED]";
      } else {
        result[key] = sanitize(item);
      }
    }

    return result;
  }

  return value;
}

function write(
  level: LogLevel,
  message: string,
  context?: LogContext
) {
  const sanitized = sanitize(context ?? {});

  const entry: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    level,
    service: "nexus",
    environment: process.env.NODE_ENV ?? "development",
    message,
  };

  if (
    typeof sanitized === "object" &&
    sanitized !== null &&
    !Array.isArray(sanitized)
  ) {
    Object.assign(entry, sanitized);
  }

  const output = JSON.stringify(entry);

  if (level === "error") {
    console.error(output);
  } else if (level === "warn") {
    console.warn(output);
  } else {
    console.info(output);
  }
}

export function createRequestId() {
  return `req_${randomUUID()}`;
}

export const logger = {
  info(message: string, context?: LogContext) {
    write("info", message, context);
  },

  warn(message: string, context?: LogContext) {
    write("warn", message, context);
  },

  error(message: string, context?: LogContext) {
    write("error", message, context);
  },
};

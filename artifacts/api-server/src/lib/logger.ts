import pino from "pino";

const isProduction = process.env.NODE_ENV === "production";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  redact: [
    "req.headers.authorization",
    "req.headers.cookie",
    "res.headers['set-cookie']",
  ],
  ...(isProduction
    ? {}
    : {
        transport: {
          target: "pino-pretty",
          options: { colorize: true },
        },
      }),
});

const databaseErrorFields = [
  "code",
  "detail",
  "hint",
  "position",
  "where",
  "schema",
  "table",
  "column",
  "constraint",
  "routine",
  "severity",
  "file",
  "line",
] as const;

export function serializeError(error: unknown, depth = 0): unknown {
  if (error === null || error === undefined) return error;
  if (depth > 3) return "[error cause truncated]";
  if (typeof error !== "object" && typeof error !== "function") {
    return error;
  }

  const value = error as Record<string, unknown>;
  const serialized: Record<string, unknown> = {};

  for (const key of ["name", "message", "stack"] as const) {
    if (typeof value[key] === "string") serialized[key] = value[key];
  }

  for (const key of databaseErrorFields) {
    if (value[key] !== undefined) serialized[key] = value[key];
  }

  if (value.cause !== undefined) {
    serialized.cause = serializeError(value.cause, depth + 1);
  }

  return serialized;
}

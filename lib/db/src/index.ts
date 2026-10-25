import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

type SerializedPoolError = {
  name?: string;
  message?: string;
  stack?: string;
  code?: unknown;
  detail?: unknown;
  hint?: unknown;
  severity?: unknown;
  routine?: unknown;
  cause?: unknown;
};

function serializePoolError(error: unknown): SerializedPoolError {
  if (error === null || typeof error !== "object") {
    return {
      message: String(error),
    };
  }

  const value = error as Record<string, unknown>;
  return {
    name: typeof value.name === "string" ? value.name : undefined,
    message: typeof value.message === "string" ? value.message : undefined,
    stack: typeof value.stack === "string" ? value.stack : undefined,
    code: value.code,
    detail: value.detail,
    hint: value.hint,
    severity: value.severity,
    routine: value.routine,
    cause:
      value.cause && typeof value.cause === "object"
        ? serializePoolError(value.cause)
        : value.cause,
  };
}

function getConnectionSummary(connectionString: string) {
  const url = new URL(connectionString);
  return {
    host: url.hostname,
    port: url.port || "5432",
    database: url.pathname.replace(/^\/+/, ""),
    sslmode: url.searchParams.get("sslmode") ?? undefined,
    channelBinding: url.searchParams.get("channel_binding") ?? undefined,
    pooler: url.hostname.includes("-pooler."),
  };
}

try {
  console.info(
    "[db] PostgreSQL connection configuration",
    getConnectionSummary(databaseUrl),
  );
} catch (error) {
  console.error("[db] DATABASE_URL could not be parsed", serializePoolError(error));
}

export const pool = new Pool({ connectionString: databaseUrl });

pool.on("error", (error) => {
  console.error("[db] PostgreSQL pool error", serializePoolError(error));
});

export const db = drizzle(pool, { schema });

export * from "./schema";

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

const databaseUrl = process.env.USE_DEVELOPMENT_DATABASE === "true"
  ? process.env.DEVELOPMENT_DATABASE_URL
  : process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    process.env.USE_DEVELOPMENT_DATABASE === "true"
      ? "DEVELOPMENT_DATABASE_URL must be set when USE_DEVELOPMENT_DATABASE=true."
      : "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: databaseUrl });
export const db = drizzle(pool, { schema });

export * from "./schema";

import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";
import * as schema from "./schema";

let client: Sql | null = null;
let database: PostgresJsDatabase<typeof schema> | null = null;

export function getDb() {
  if (database) return database;

  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured in Vercel");
  }

  client = postgres(connectionString, {
    max: 1,
    prepare: false,
    ssl: process.env.NODE_ENV === "production" ? "require" : undefined,
  });
  database = drizzle(client, { schema });
  return database;
}

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./drizzle-schema";

type Database = ReturnType<typeof drizzle<typeof schema>>;

let db: Database | null = null;

export function getDb() {
  if (db) {
    return db;
  }

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required before using database actions.");
  }

  db = drizzle(neon(databaseUrl), { schema });

  return db;
}


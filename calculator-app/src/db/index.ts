import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Lazy initialization: neon() throws if DATABASE_URL is unset, and Next.js
// evaluates top-level module code at build time, so eager init would crash
// `next build` on projects without the database provisioned.
function createDb() {
  const sql = neon(process.env.DATABASE_URL!);
  return drizzle(sql, { schema });
}

let _db: ReturnType<typeof createDb> | null = null;

export function getDb() {
  if (!_db) {
    _db = createDb();
  }
  return _db;
}

export function isDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

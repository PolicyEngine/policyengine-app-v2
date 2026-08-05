import { drizzle } from "drizzle-orm/postgres-js";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Driver-agnostic database handle: satisfied by postgres-js against
 * Supabase in production and by PGlite in integration tests.
 */
export type ReformDb = PgDatabase<PgQueryResultHKT, typeof schema>;

// Lazy initialization: Next.js evaluates top-level module code at build
// time, so eager init would crash `next build` on projects without the
// database provisioned.
function createDb(): ReformDb {
  // Supabase's pooled connection string (transaction mode) does not
  // support prepared statements.
  const sql = postgres(process.env.DATABASE_URL!, { prepare: false });
  return drizzle(sql, { schema });
}

let _db: ReformDb | null = null;

export function getDb(): ReformDb {
  if (!_db) {
    _db = createDb();
  }
  return _db;
}

export function isDbConfigured(): boolean {
  return _db !== null || Boolean(process.env.DATABASE_URL);
}

/** Inject a database (e.g. PGlite) for integration tests; pass null to reset. */
export function setDbForTesting(db: ReformDb | null): void {
  _db = db;
}

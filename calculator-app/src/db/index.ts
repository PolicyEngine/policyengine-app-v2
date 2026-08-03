import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as schema from "./schema";

/**
 * Driver-agnostic database handle: satisfied by the Neon HTTP driver in
 * production and by PGlite in integration tests.
 */
export type ReformDb = PgDatabase<PgQueryResultHKT, typeof schema>;

// Lazy initialization: neon() throws if DATABASE_URL is unset, and Next.js
// evaluates top-level module code at build time, so eager init would crash
// `next build` on projects without the database provisioned.
function createDb(): ReformDb {
  const sql = neon(process.env.DATABASE_URL!);
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

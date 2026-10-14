import { count, gt, sql } from "drizzle-orm";
import { getDb, type ReformDb } from "./index";
import { reforms, reports } from "./schema";

/**
 * Abuse limits for the flagship store routes. They need no client
 * identifier: the per-client rate limit lives at Vercel's edge, keyed by
 * IP there and never seen here (see README). These limits bound what any
 * one request, and all requests together, can add to the database.
 */

/** Largest request body the store routes accept. */
export const MAX_BODY_BYTES = 256 * 1024;

/** Longest free-text field: a reform label, a report title or source note. */
export const MAX_TEXT_LENGTH = 500;

/**
 * New rows per table per minute, across all visitors. A backstop for the
 * edge rate limit: it caps growth even when that rule is missing. Clients
 * that hit it save to their localStorage fallback instead.
 */
export const NEW_ROWS_PER_MINUTE = 120;

export type JsonBodyResult =
  | { body: unknown }
  | { error: string; status: 400 | 413 };

/**
 * Reads a JSON body of at most MAX_BODY_BYTES. The declared length is
 * checked first; the actual length too, since a chunked body declares
 * none. (Vercel already caps bodies at 4.5 MB before the handler runs.)
 */
export async function readJsonBody(request: Request): Promise<JsonBodyResult> {
  const tooLarge = {
    error: `Request body must be at most ${MAX_BODY_BYTES / 1024} KB`,
    status: 413 as const,
  };
  if (Number(request.headers.get("content-length")) > MAX_BODY_BYTES) {
    return tooLarge;
  }
  const text = await request.text();
  if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) {
    return tooLarge;
  }
  try {
    return { body: JSON.parse(text) };
  } catch {
    return { error: "Invalid JSON body", status: 400 };
  }
}

/**
 * Why an optional free-text field is invalid, or null when it is fine:
 * absent, null, or a string of at most MAX_TEXT_LENGTH characters.
 */
export function invalidText(name: string, value: unknown): string | null {
  if (value === undefined || value === null) {
    return null;
  }
  if (typeof value !== "string") {
    return `${name} must be a string or null`;
  }
  if (value.length > MAX_TEXT_LENGTH) {
    return `${name} must be at most ${MAX_TEXT_LENGTH} characters`;
  }
  return null;
}

/** A transaction-scoped advisory lock per table, so creates on it count in turn. */
const BUDGET_LOCK_KEYS = new Map<typeof reforms | typeof reports, number>([
  [reforms, 724_101],
  [reports, 724_102],
]);

/**
 * Inserts a row if the table took fewer than NEW_ROWS_PER_MINUTE in the
 * last minute; null when the budget is used up. The count and the insert
 * share one transaction under the table's advisory lock: counted apart,
 * concurrent creates would all read a count under the limit and all
 * insert. The lock is transaction-scoped, which Supabase's transaction
 * pooler supports, and is released at commit.
 */
export async function insertWithinBudget<T>(
  table: typeof reforms | typeof reports,
  insert: (tx: ReformDb) => Promise<T>,
): Promise<T | null> {
  return getDb().transaction(async (tx) => {
    await tx.execute(
      sql`select pg_advisory_xact_lock(${BUDGET_LOCK_KEYS.get(table)!})`,
    );
    // The database clock, so app-server clock skew cannot widen the window.
    const [row] = await tx
      .select({ value: count() })
      .from(table)
      .where(gt(table.createdAt, sql`now() - interval '1 minute'`));
    if ((row?.value ?? 0) >= NEW_ROWS_PER_MINUTE) {
      return null;
    }
    return insert(tx as unknown as ReformDb);
  });
}

/** 429 for a create while the new-row budget is used up. */
export function newRowBudgetResponse(): Response {
  return new Response(
    JSON.stringify({
      error: "The store is taking no new items this minute; try again shortly",
    }),
    {
      status: 429,
      headers: { "Content-Type": "application/json", "Retry-After": "60" },
    },
  );
}

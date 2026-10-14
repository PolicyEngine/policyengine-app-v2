/**
 * Postgres codes for a schema the code expects but the database lacks —
 * a migration not run yet: an undefined column or table.
 */
const UNMIGRATED_CODES = new Set(["42703", "42P01"]);

/** Whether a database error means the latest migration has not run. */
export function isUnmigratedSchemaError(error: unknown): boolean {
  const code =
    (error as { code?: unknown } | null)?.code ??
    (error as { cause?: { code?: unknown } } | null)?.cause?.code;
  return typeof code === "string" && UNMIGRATED_CODES.has(code);
}

/**
 * Runs a store route; a database without the latest migration answers
 * 503 — "store unavailable" — rather than 500, so the client falls back
 * to its localStorage store instead of failing the save. Other errors
 * stay errors.
 */
export async function guardSchema(
  handler: () => Promise<Response>,
): Promise<Response> {
  try {
    return await handler();
  } catch (error) {
    if (isUnmigratedSchemaError(error)) {
      return new Response(
        JSON.stringify({
          error: "The store's database needs its latest migration",
        }),
        { status: 503, headers: { "Content-Type": "application/json" } },
      );
    }
    throw error;
  }
}

/**
 * The central store takes free text (a reform label, a report title or
 * source note) of at most this many characters, and refuses longer
 * (calculator-app/src/db/limits.ts). A long bill title would fail the
 * save outright, so the client shortens it first.
 */
export const MAX_STORE_TEXT_LENGTH = 500;

/** The text cut to the store's limit, with an ellipsis; null and undefined pass through. */
export function clampStoreText<T extends string | null | undefined>(text: T): T {
  if (typeof text !== 'string' || text.length <= MAX_STORE_TEXT_LENGTH) {
    return text;
  }
  return `${text.slice(0, MAX_STORE_TEXT_LENGTH - 1)}…` as T;
}

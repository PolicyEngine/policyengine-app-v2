/**
 * The Public API's saved-work routes take a name (a reform's label, a
 * report's title) of at most 255 characters and a note of at most 10,000,
 * and refuse longer. A long bill title would fail the save outright, so
 * the client shortens it first.
 */
export const MAX_STORE_NAME_LENGTH = 255;
export const MAX_STORE_NOTE_LENGTH = 10_000;

/**
 * The text cut to `maxLength` characters, with an ellipsis; null and
 * undefined pass through. Characters are code points, as the API counts
 * them, so an emoji is one character and is never cut in half (half of one
 * is not valid text, and the API refuses it).
 */
export function clampStoreText<T extends string | null | undefined>(
  text: T,
  maxLength: number = MAX_STORE_NAME_LENGTH
): T {
  if (typeof text !== 'string') {
    return text;
  }
  const characters = Array.from(text);
  if (characters.length <= maxLength) {
    return text;
  }
  return `${characters.slice(0, maxLength - 1).join('')}…` as T;
}

/**
 * Utility functions for scrubbing user IDs from objects before display
 * Used to protect user privacy in error reports and debug views
 */

/**
 * Scrub userId from an object, replacing it with "[scrubbed]"
 * Handles both camelCase (userId) and snake_case (user_id) variants
 */
export function scrubUserId<T>(obj: T): T {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  const scrubbed = { ...obj } as Record<string, unknown>;
  if ('userId' in scrubbed) {
    scrubbed.userId = '[scrubbed]';
  }
  if ('user_id' in scrubbed) {
    scrubbed.user_id = '[scrubbed]';
  }
  return scrubbed as T;
}

/**
 * Scrub userId from an array of objects
 */
export function scrubUserIdArray<T>(arr: T[] | null | undefined): T[] | null {
  if (!arr) {
    return null;
  }
  return arr.map((item) => scrubUserId(item));
}

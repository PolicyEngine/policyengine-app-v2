/**
 * This browser's unauthenticated user: a random UUID made on the first
 * visit and kept with no expiry. Signed out, the v3 workspace saves work
 * to the PolicyEngine API as this user (the `PolicyEngine-Unauthenticated-User`
 * header), so nothing saved lives only in the browser. The UUID is the
 * credential for that work: it never goes in a URL or a log.
 *
 * Signing in upgrades this user into the account (`POST /v2/me/upgrade`),
 * after which the browser starts over with a new UUID, so the next person
 * signed out on this browser starts with nothing.
 */

const BROWSER_USER_KEY = 'pe-browser-user-id';

/** Used only when localStorage is unavailable: lasts for this page. */
let pageOnlyUserId: string | null = null;

function newUserId(): string {
  return crypto.randomUUID();
}

function storeUserId(userId: string): void {
  try {
    localStorage.setItem(BROWSER_USER_KEY, userId);
    pageOnlyUserId = null;
  } catch {
    pageOnlyUserId = userId;
  }
}

/** This browser's unauthenticated user ID, made on first use. */
export function getBrowserUserId(): string {
  try {
    const stored = localStorage.getItem(BROWSER_USER_KEY);
    if (stored) {
      return stored;
    }
  } catch {
    // Storage unavailable: fall back to an ID for this page.
  }
  if (pageOnlyUserId) {
    return pageOnlyUserId;
  }
  const userId = newUserId();
  storeUserId(userId);
  return userId;
}

/** Starts this browser over with a new unauthenticated user (after an upgrade). */
export function replaceBrowserUserId(): string {
  const userId = newUserId();
  storeUserId(userId);
  return userId;
}

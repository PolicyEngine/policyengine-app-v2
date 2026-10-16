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

/** The form the API accepts for this user: a lowercase, hyphenated UUID. */
const CANONICAL_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** Used only when localStorage is unavailable: lasts for this page. */
let pageOnlyUserId: string | null = null;

/**
 * A random (version 4) UUID. `crypto.randomUUID` needs a secure context
 * and a recent browser; `crypto.getRandomValues` works everywhere, so it
 * builds one when `randomUUID` is missing.
 */
function newUserId(): string {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function storeUserId(userId: string): void {
  try {
    localStorage.setItem(BROWSER_USER_KEY, userId);
    pageOnlyUserId = null;
  } catch {
    pageOnlyUserId = userId;
  }
}

/**
 * This browser's unauthenticated user ID, made on first use. A stored value
 * the API would refuse (damaged, or edited by hand) is replaced, rather than
 * failing every signed-out request.
 */
export function getBrowserUserId(): string {
  try {
    const stored = localStorage.getItem(BROWSER_USER_KEY);
    if (stored && CANONICAL_UUID.test(stored)) {
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

import { EDIT_TOKEN_HEADER, isUuid } from "@/libs/flagship/ownedItems";

export { isUuid };

/**
 * Anonymous ownership for flagship items. There is no sign-in, so the
 * server stores no user identifier: creating an item issues a random
 * 256-bit edit token, returns it to the browser once, and keeps only its
 * SHA-256 hash. Changing or deleting the item requires the token.
 *
 * Uses Web Crypto rather than node:crypto because these files are also
 * typechecked inside the Vite app's program.
 */

const TOKEN_BYTES = 32;

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

export async function hashEditToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(token),
  );
  return toHex(new Uint8Array(digest));
}

/** A fresh token for the browser and the hash to store in its place. */
export async function issueEditToken(): Promise<{
  token: string;
  hash: string;
}> {
  const token = toHex(crypto.getRandomValues(new Uint8Array(TOKEN_BYTES)));
  return { token, hash: await hashEditToken(token) };
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let difference = 0;
  for (let index = 0; index < a.length; index += 1) {
    difference |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return difference === 0;
}

/**
 * Whether the request carries the token whose hash the row stores.
 * Legacy rows have no hash, so nobody can change them.
 */
export async function presentsEditToken(
  request: Request,
  storedHash: string | null,
): Promise<boolean> {
  const token = request.headers.get(EDIT_TOKEN_HEADER);
  if (!storedHash || !token) {
    return false;
  }
  return constantTimeEqual(await hashEditToken(token), storedHash);
}

/** Most ids one batch read accepts. */
export const MAX_IDS_PER_REQUEST = 100;

/**
 * The `ids` query parameter of a batch read: comma-separated item ids,
 * deduplicated. Entries that are not UUIDs cannot name a row, so they
 * are dropped. Returns null when the parameter is missing or too long.
 */
export function parseIdList(searchParams: URLSearchParams): string[] | null {
  const raw = searchParams.get("ids");
  if (raw === null) {
    return null;
  }
  const ids = [...new Set(raw.split(",").map((id) => id.trim()))].filter(
    isUuid,
  );
  return ids.length > MAX_IDS_PER_REQUEST ? null : ids;
}

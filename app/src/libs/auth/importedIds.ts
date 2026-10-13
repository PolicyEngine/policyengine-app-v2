/**
 * Where this browser's localStorage items went when they were saved to an
 * account: `client_ref` (the local ID, e.g. `sur-…`, `lfr-…`, `rf-…`) →
 * the account's association UUID, per PolicyEngine user. Old links that
 * carry a local ID keep resolving after sign-in through this map. Items
 * the import skipped are remembered too, so the prompt does not offer
 * them again. Nothing here deletes local data.
 */

export const IMPORTED_ID_MAP_KEY = 'pe-imported-id-map';
export const IMPORT_SKIPPED_KEY = 'pe-import-skipped';

type PerUser<T> = Record<string, Record<string, T>>;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Association IDs on the server are UUIDs; local IDs never are. */
export function isUuid(id: unknown): id is string {
  return typeof id === 'string' && UUID_RE.test(id);
}

function readPerUser<T>(key: string): PerUser<T> {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) ?? '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function writePerUser<T>(key: string, value: PerUser<T>): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable: the import itself still succeeded.
  }
}

export function readImportedIdMap(userId: string): Record<string, string> {
  return { ...(readPerUser<string>(IMPORTED_ID_MAP_KEY)[userId] ?? {}) };
}

export function recordImportedIds(userId: string, idMap: Record<string, string>): void {
  const all = readPerUser<string>(IMPORTED_ID_MAP_KEY);
  all[userId] = { ...(all[userId] ?? {}), ...idMap };
  writePerUser(IMPORTED_ID_MAP_KEY, all);
}

/**
 * Local IDs any account has imported from this browser. Their items are
 * that account's now, so the import does not offer them to someone else
 * who signs in here.
 */
export function readRefsImportedByAnyone(): Set<string> {
  return new Set(
    Object.values(readPerUser<string>(IMPORTED_ID_MAP_KEY)).flatMap((idMap) =>
      Object.keys(idMap ?? {})
    )
  );
}

export function readImportSkipped(userId: string): Record<string, string> {
  return { ...(readPerUser<string>(IMPORT_SKIPPED_KEY)[userId] ?? {}) };
}

export function recordImportSkipped(userId: string, skipped: Record<string, string>): void {
  const all = readPerUser<string>(IMPORT_SKIPPED_KEY);
  all[userId] = { ...(all[userId] ?? {}), ...skipped };
  writePerUser(IMPORT_SKIPPED_KEY, all);
}

/**
 * The account association ID for an ID from a link or a local record:
 * UUIDs pass through, imported local IDs map to their UUID, anything else
 * is null.
 */
export function resolveImportedId(userId: string, id: string): string | null {
  if (isUuid(id)) {
    return id;
  }
  return readImportedIdMap(userId)[id] ?? null;
}

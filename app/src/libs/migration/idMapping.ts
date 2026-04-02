/**
 * V1 ↔ V2 ID Mapping
 *
 * Stores the mapping between v1 IDs (integer or localStorage sup-* IDs)
 * and v2 UUIDs in localStorage. Used by dual-write shadow validation
 * during the API migration (Phases 2-4). Deleted in Phase 5.
 *
 * localStorage key format: v1v2:{entityType}:{v1Id}
 * Value: the v2 UUID string
 */

const KEY_PREFIX = "v1v2";

function storageKey(entityType: string, v1Id: string): string {
  return `${KEY_PREFIX}:${entityType}:${v1Id}`;
}

export function setV2Id(
  entityType: string,
  v1Id: string,
  v2Id: string,
): void {
  try {
    localStorage.setItem(storageKey(entityType, v1Id), v2Id);
  } catch (error) {
    console.info(
      `[${entityType}Migration] Failed to store ID mapping: ${v1Id} → ${v2Id}`,
      error,
    );
  }
}

export function getV2Id(
  entityType: string,
  v1Id: string,
): string | null {
  try {
    return localStorage.getItem(storageKey(entityType, v1Id));
  } catch (error) {
    console.info(
      `[${entityType}Migration] Failed to read ID mapping for ${v1Id}`,
      error,
    );
    return null;
  }
}

export function clearV2Mappings(entityType?: string): void {
  try {
    const prefix = entityType
      ? `${KEY_PREFIX}:${entityType}:`
      : `${KEY_PREFIX}:`;
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch (error) {
    console.info("[Migration] Failed to clear ID mappings", error);
  }
}

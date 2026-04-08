/**
 * V1 ↔ V2 ID Mapping
 *
 * Stores the mapping between v1 IDs (integer or localStorage sup-* IDs)
 * and v2 UUIDs in localStorage. Used by dual-write shadow validation
 * during the API migration (Phases 2-4). Deleted in Phase 5.
 *
 * localStorage key format: v1v2:{lowercaseEntityType}:{v1Id}
 * Value: the v2 UUID string
 */

import { logMigrationConsole } from './migrationLogRuntime';
import { sendMigrationLog } from './migrationLogTransport';

const KEY_PREFIX = 'v1v2';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function storageKey(entityType: string, v1Id: string): string {
  return `${KEY_PREFIX}:${entityType.toLowerCase()}:${v1Id}`;
}

function createUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

export function isUuid(id: string): boolean {
  return UUID_RE.test(id);
}

export function setV2Id(entityType: string, v1Id: string, v2Id: string): void {
  try {
    localStorage.setItem(storageKey(entityType, v1Id), v2Id);
  } catch (error) {
    logMigrationConsole(
      `[${entityType}Migration] Failed to store ID mapping: ${v1Id} → ${v2Id}`,
      error
    );
    sendMigrationLog({
      kind: 'event',
      prefix: `${entityType}Migration`,
      status: 'FAILED',
      message: 'Failed to store ID mapping',
      metadata: {
        entityType,
        v1Id,
        v2Id,
        error: error instanceof Error ? error.message : String(error),
      },
      ts: new Date().toISOString(),
    });
  }
}

export function getV2Id(entityType: string, v1Id: string): string | null {
  try {
    return localStorage.getItem(storageKey(entityType, v1Id));
  } catch (error) {
    logMigrationConsole(`[${entityType}Migration] Failed to read ID mapping for ${v1Id}`, error);
    sendMigrationLog({
      kind: 'event',
      prefix: `${entityType}Migration`,
      status: 'FAILED',
      message: 'Failed to read ID mapping',
      metadata: {
        entityType,
        v1Id,
        error: error instanceof Error ? error.message : String(error),
      },
      ts: new Date().toISOString(),
    });
    return null;
  }
}

export function clearV2Mappings(entityType?: string): void {
  try {
    const prefix = entityType ? `${KEY_PREFIX}:${entityType.toLowerCase()}:` : `${KEY_PREFIX}:`;
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch (error) {
    logMigrationConsole('[Migration] Failed to clear ID mappings', error);
    sendMigrationLog({
      kind: 'event',
      prefix: 'Migration',
      status: 'FAILED',
      message: 'Failed to clear ID mappings',
      metadata: {
        entityType: entityType ?? null,
        error: error instanceof Error ? error.message : String(error),
      },
      ts: new Date().toISOString(),
    });
  }
}

export function getOrCreateV2UserId(v1UserId: string): string {
  const existing = getV2Id('User', v1UserId);
  if (existing) {
    return existing;
  }

  const v2UserId = isUuid(v1UserId) ? v1UserId : createUuid();
  setV2Id('User', v1UserId, v2UserId);
  return v2UserId;
}

export function getMappedV2UserId(v1UserId: string): string | null {
  return getV2Id('User', v1UserId) ?? (isUuid(v1UserId) ? v1UserId : null);
}

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
const TARGET_KEY_PREFIX = 'v1v2-target';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function storageKey(entityType: string, v1Id: string): string {
  return `${KEY_PREFIX}:${entityType.toLowerCase()}:${v1Id}`;
}

function targetStorageKey(entityType: string, v1AssociationId: string, v1TargetId: string): string {
  return `${TARGET_KEY_PREFIX}:${entityType.toLowerCase()}:${v1AssociationId}:${v1TargetId}`;
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

export function setV2AssociationTargetId(
  entityType: string,
  v1AssociationId: string,
  v1TargetId: string,
  v2Id: string
): void {
  try {
    localStorage.setItem(targetStorageKey(entityType, v1AssociationId, v1TargetId), v2Id);
  } catch (error) {
    logMigrationConsole(
      `[${entityType}Migration] Failed to store target mapping: ${v1AssociationId}/${v1TargetId} → ${v2Id}`,
      error
    );
    sendMigrationLog({
      kind: 'event',
      prefix: `${entityType}Migration`,
      status: 'FAILED',
      message: 'Failed to store target mapping',
      metadata: {
        entityType,
        v1AssociationId,
        v1TargetId,
        v2Id,
        error: error instanceof Error ? error.message : String(error),
      },
      ts: new Date().toISOString(),
    });
  }
}

export function getV2AssociationTargetId(
  entityType: string,
  v1AssociationId: string,
  v1TargetId: string
): string | null {
  try {
    return localStorage.getItem(targetStorageKey(entityType, v1AssociationId, v1TargetId));
  } catch (error) {
    logMigrationConsole(
      `[${entityType}Migration] Failed to read target mapping for ${v1AssociationId}/${v1TargetId}`,
      error
    );
    sendMigrationLog({
      kind: 'event',
      prefix: `${entityType}Migration`,
      status: 'FAILED',
      message: 'Failed to read target mapping',
      metadata: {
        entityType,
        v1AssociationId,
        v1TargetId,
        error: error instanceof Error ? error.message : String(error),
      },
      ts: new Date().toISOString(),
    });
    return null;
  }
}

export function clearV2AssociationTargetId(
  entityType: string,
  v1AssociationId: string,
  v1TargetId: string
): void {
  try {
    localStorage.removeItem(targetStorageKey(entityType, v1AssociationId, v1TargetId));
  } catch (error) {
    logMigrationConsole(
      `[${entityType}Migration] Failed to clear target mapping for ${v1AssociationId}/${v1TargetId}`,
      error
    );
    sendMigrationLog({
      kind: 'event',
      prefix: `${entityType}Migration`,
      status: 'FAILED',
      message: 'Failed to clear target mapping',
      metadata: {
        entityType,
        v1AssociationId,
        v1TargetId,
        error: error instanceof Error ? error.message : String(error),
      },
      ts: new Date().toISOString(),
    });
  }
}

export function clearV2Mappings(entityType?: string): void {
  try {
    const prefixes = entityType
      ? [
          `${KEY_PREFIX}:${entityType.toLowerCase()}:`,
          `${TARGET_KEY_PREFIX}:${entityType.toLowerCase()}:`,
        ]
      : [`${KEY_PREFIX}:`, `${TARGET_KEY_PREFIX}:`];
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && prefixes.some((prefix) => key.startsWith(prefix))) {
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

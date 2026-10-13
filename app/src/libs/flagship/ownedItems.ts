/**
 * This browser's index of the flagship items it saved to the central
 * store. There is no sign-in yet: the server keeps each reform and
 * report record under an unguessable id with no user identifier, so
 * only this index knows which items are "mine". Each entry carries the
 * edit token the server issued once, at creation; the server checks it
 * on every change, so only the browser that created an item can edit
 * or delete it.
 *
 * Items saved to the localStorage fallback stores are not indexed here:
 * they live in this browser already, and their stores list them.
 *
 * Every read and write tolerates unavailable or corrupt storage (private
 * windows, blocked site data): reads come back empty, writes are lost.
 */

/** Request header that carries an item's edit token to the server. */
export const EDIT_TOKEN_HEADER = 'X-Edit-Token';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Central ids are UUIDs; the localStorage fallbacks use prefixed ids
 * ("rf-…", "lfr-…") that the central store cannot hold.
 */
export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

export type OwnedItemKind = 'reforms' | 'reports';

export interface OwnedItem {
  /** The item's id on the central store. */
  id: string;
  countryId: string;
  /** Issued by the server at creation; proves this browser created the item. */
  editToken: string;
  /** Reports only: the api.policyengine.org report the record points at. */
  apiReportId?: string;
  addedAt: string;
}

const STORAGE_KEYS: Record<OwnedItemKind, string> = {
  reforms: 'pe-flagship-owned-reforms',
  reports: 'pe-flagship-owned-reports',
};

/**
 * The central store did not issue an edit token for this browser, so
 * the item is someone else's (or a legacy row, which is read-only).
 */
export class ItemNotOwnedError extends Error {
  constructor() {
    super('This browser cannot change this item');
    this.name = 'ItemNotOwnedError';
  }
}

function isOwnedItem(value: unknown): value is OwnedItem {
  const item = value as OwnedItem | null;
  return (
    !!item &&
    typeof item.id === 'string' &&
    typeof item.countryId === 'string' &&
    typeof item.editToken === 'string' &&
    (item.apiReportId === undefined || typeof item.apiReportId === 'string')
  );
}

function readAll(kind: OwnedItemKind): OwnedItem[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEYS[kind]) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter(isOwnedItem) : [];
  } catch {
    return [];
  }
}

function writeAll(kind: OwnedItemKind, items: OwnedItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS[kind], JSON.stringify(items));
  } catch {
    // The item stays on the server, readable by id, but drops off this
    // browser's lists.
  }
}

/** This browser's items of a kind, newest first, optionally for one country. */
export function readOwnedItems(kind: OwnedItemKind, countryId?: string): OwnedItem[] {
  return readAll(kind).filter((item) => !countryId || item.countryId === countryId);
}

export function findOwnedItem(kind: OwnedItemKind, id: string): OwnedItem | null {
  return readAll(kind).find((item) => item.id === id) ?? null;
}

/** The report record this browser saved for an API report, if any. */
export function findOwnedReportByApiReportId(apiReportId: string): OwnedItem | null {
  return readAll('reports').find((item) => item.apiReportId === apiReportId) ?? null;
}

export function addOwnedItem(kind: OwnedItemKind, item: Omit<OwnedItem, 'addedAt'>): void {
  const others = readAll(kind).filter((existing) => existing.id !== item.id);
  writeAll(kind, [{ ...item, addedAt: new Date().toISOString() }, ...others]);
}

export function removeOwnedItem(kind: OwnedItemKind, id: string): void {
  writeAll(
    kind,
    readAll(kind).filter((item) => item.id !== id)
  );
}

/** Headers for a change to an owned item; throws when this browser has no token for it. */
export function editTokenHeaders(kind: OwnedItemKind, id: string): Record<string, string> {
  const owned = findOwnedItem(kind, id);
  if (!owned) {
    throw new ItemNotOwnedError();
  }
  return { [EDIT_TOKEN_HEADER]: owned.editToken };
}

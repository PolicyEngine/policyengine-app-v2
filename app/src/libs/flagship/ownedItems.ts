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

/**
 * Items whose write to localStorage failed (storage full or blocked) right
 * after the server created them: kept for this session, so a reform just
 * saved still lists and still edits until the tab closes, rather than
 * vanishing with its edit token.
 */
const sessionItems: Record<OwnedItemKind, OwnedItem[]> = { reforms: [], reports: [] };

function readStored(kind: OwnedItemKind): OwnedItem[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEYS[kind]) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter(isOwnedItem) : [];
  } catch {
    return [];
  }
}

function readAll(kind: OwnedItemKind): OwnedItem[] {
  const stored = readStored(kind);
  const held = sessionItems[kind].filter((item) => !stored.some((s) => s.id === item.id));
  return [...held, ...stored];
}

/** Whether the index reached localStorage. */
function writeStored(kind: OwnedItemKind, items: OwnedItem[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEYS[kind], JSON.stringify(items));
    return true;
  } catch {
    return false;
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

/**
 * Adds an item to this browser's index. Returns false when localStorage
 * refused it: the item is then held for this session only.
 */
export function addOwnedItem(kind: OwnedItemKind, item: Omit<OwnedItem, 'addedAt'>): boolean {
  const entry = { ...item, addedAt: new Date().toISOString() };
  const others = readStored(kind).filter((existing) => existing.id !== item.id);
  if (writeStored(kind, [entry, ...others])) {
    sessionItems[kind] = sessionItems[kind].filter((held) => held.id !== item.id);
    return true;
  }
  sessionItems[kind] = [entry, ...sessionItems[kind].filter((held) => held.id !== item.id)];
  return false;
}

export function removeOwnedItem(kind: OwnedItemKind, id: string): void {
  sessionItems[kind] = sessionItems[kind].filter((item) => item.id !== id);
  writeStored(
    kind,
    readStored(kind).filter((item) => item.id !== id)
  );
}

/** Test hook: forget the items held for the session. */
export function resetSessionOwnedItemsForTesting(): void {
  sessionItems.reforms = [];
  sessionItems.reports = [];
}

/** Headers for a change to an owned item; throws when this browser has no token for it. */
export function editTokenHeaders(kind: OwnedItemKind, id: string): Record<string, string> {
  const owned = findOwnedItem(kind, id);
  if (!owned) {
    throw new ItemNotOwnedError();
  }
  return { [EDIT_TOKEN_HEADER]: owned.editToken };
}

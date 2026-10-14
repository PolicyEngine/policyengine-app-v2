import { ReformAdapter } from '@/adapters/ReformAdapter';
import {
  addOwnedItem,
  editTokenHeaders,
  ItemNotOwnedError,
  readOwnedItems,
  removeOwnedItem,
} from '@/libs/flagship/ownedItems';
import { getStoreBackend } from '@/libs/storeBackend';
import { Reform } from '@/types/ingredients/Reform';
import { ReformCreatedMetadata, ReformMetadata } from '@/types/metadata/reformMetadata';

export type NewReform = Omit<Reform, 'id' | 'createdAt' | 'updatedAt'>;
export type ReformUpdates = Partial<Omit<Reform, 'id' | 'countryId' | 'createdAt' | 'updatedAt'>>;

/**
 * Store for the flagship app's canonical reform objects.
 *
 * Reforms are mutable content persisted centrally (unlike canonical
 * Policy records, which live in the main PolicyEngine API and are
 * immutable). The API implementation talks to /api/reforms, served by
 * Next.js route handlers backed by Postgres. With no sign-in, the server
 * stores no user identifier: "mine" is this browser's index of the ids
 * it created, and each change carries the item's edit token.
 */
export interface ReformStore {
  create: (reform: NewReform) => Promise<Reform>;
  /** The reforms this browser saved, most recently updated first. */
  findMine: (countryId?: string) => Promise<Reform[]>;
  findById: (reformId: string) => Promise<Reform | null>;
  update: (reformId: string, updates: ReformUpdates) => Promise<Reform>;
  delete: (reformId: string) => Promise<void>;
}

/**
 * The central store reported itself unconfigured (503, e.g. no
 * DATABASE_URL) or absent (collection-level 404). Distinct from real
 * failures so the resilient store knows falling back is safe.
 */
export class ReformStoreUnavailableError extends Error {
  constructor() {
    super('Reform store unavailable');
    this.name = 'ReformStoreUnavailableError';
  }
}

function throwIfUnavailable(response: Response): void {
  if (response.status === 503 || response.status === 404) {
    throw new ReformStoreUnavailableError();
  }
}

/**
 * The central store took its limit of new reforms this minute (429). The
 * resilient store saves that one reform locally and keeps using the
 * central store.
 */
export class ReformStoreBusyError extends Error {
  constructor() {
    super('Reform store is taking no new reforms this minute');
    this.name = 'ReformStoreBusyError';
  }
}

/** Ids per batch read, so the query string stays well under URL limits. */
const IDS_PER_REQUEST = 50;

function byMostRecentlyUpdated(a: Reform, b: Reform): number {
  return (b.updatedAt ?? b.createdAt ?? '').localeCompare(a.updatedAt ?? a.createdAt ?? '');
}

export class ApiReformStore implements ReformStore {
  private readonly BASE_URL = '/api/reforms';

  async create(reform: NewReform): Promise<Reform> {
    const payload = ReformAdapter.toCreationPayload(reform);

    const response = await fetch(this.BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throwIfUnavailable(response);
      if (response.status === 429) {
        throw new ReformStoreBusyError();
      }
      throw new Error('Failed to create reform');
    }

    const { edit_token: editToken, ...apiData }: ReformCreatedMetadata = await response.json();
    const created = ReformAdapter.fromApiResponse(apiData);
    addOwnedItem('reforms', { id: created.id!, countryId: created.countryId, editToken });
    return created;
  }

  async findMine(countryId?: string): Promise<Reform[]> {
    const ids = readOwnedItems('reforms', countryId).map((item) => item.id);
    const reforms: Reform[] = [];
    for (let start = 0; start < ids.length; start += IDS_PER_REQUEST) {
      const params = new URLSearchParams({
        ids: ids.slice(start, start + IDS_PER_REQUEST).join(','),
      });
      const response = await fetch(`${this.BASE_URL}?${params.toString()}`, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throwIfUnavailable(response);
        throw new Error('Failed to fetch reforms');
      }

      const apiData: ReformMetadata[] = await response.json();
      reforms.push(...apiData.map((item) => ReformAdapter.fromApiResponse(item)));
    }
    return reforms.sort(byMostRecentlyUpdated);
  }

  async findById(reformId: string): Promise<Reform | null> {
    const response = await fetch(`${this.BASE_URL}/${reformId}`, {
      headers: { 'Content-Type': 'application/json' },
    });

    // Item-level 404 legitimately means "not found", so only 503
    // signals an unconfigured store here.
    if (response.status === 503) {
      throw new ReformStoreUnavailableError();
    }

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error('Failed to fetch reform');
    }

    const apiData: ReformMetadata = await response.json();
    return ReformAdapter.fromApiResponse(apiData);
  }

  async update(reformId: string, updates: ReformUpdates): Promise<Reform> {
    const payload = ReformAdapter.toUpdatePayload(updates);

    const response = await fetch(`${this.BASE_URL}/${reformId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...editTokenHeaders('reforms', reformId) },
      body: JSON.stringify(payload),
    });

    if (response.status === 503) {
      throw new ReformStoreUnavailableError();
    }

    if (response.status === 403) {
      throw new ItemNotOwnedError();
    }

    if (!response.ok) {
      throw new Error('Failed to update reform');
    }

    const apiData: ReformMetadata = await response.json();
    return ReformAdapter.fromApiResponse(apiData);
  }

  async delete(reformId: string): Promise<void> {
    const response = await fetch(`${this.BASE_URL}/${reformId}`, {
      method: 'DELETE',
      headers: editTokenHeaders('reforms', reformId),
    });

    if (response.status === 503) {
      throw new ReformStoreUnavailableError();
    }

    if (response.status === 403) {
      throw new ItemNotOwnedError();
    }

    if (!response.ok) {
      throw new Error('Failed to delete reform');
    }

    removeOwnedItem('reforms', reformId);
  }
}

/**
 * The browser-only fallback. Everything in it was saved in this
 * browser, so all of it is "mine" — including reforms saved before the
 * central store dropped user ids, which still carry a userId field.
 */
export class LocalStorageReformStore implements ReformStore {
  private readonly STORAGE_KEY = 'reforms';

  async create(reform: NewReform): Promise<Reform> {
    // Generate a unique ID for local storage
    // Format: "rf-[short-timestamp][random]"
    // Use base36 encoding for compactness
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 6);
    const uniqueId = `rf-${timestamp}${random}`;

    const now = new Date().toISOString();
    const newReform: Reform = {
      ...reform,
      id: uniqueId,
      createdAt: now,
      updatedAt: now,
    };

    this.setStoredReforms([...this.getStoredReforms(), newReform]);
    return newReform;
  }

  async findMine(countryId?: string): Promise<Reform[]> {
    return this.getStoredReforms()
      .filter((r) => !countryId || r.countryId === countryId)
      .sort(byMostRecentlyUpdated);
  }

  async findById(reformId: string): Promise<Reform | null> {
    return this.getStoredReforms().find((r) => r.id === reformId) || null;
  }

  async update(reformId: string, updates: ReformUpdates): Promise<Reform> {
    const reforms = this.getStoredReforms();
    const index = reforms.findIndex((r) => r.id === reformId);

    if (index === -1) {
      throw new Error('Failed to update reform');
    }

    const updated: Reform = {
      ...reforms[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    reforms[index] = updated;
    this.setStoredReforms(reforms);
    return updated;
  }

  async delete(reformId: string): Promise<void> {
    this.setStoredReforms(this.getStoredReforms().filter((r) => r.id !== reformId));
  }

  private getStoredReforms(): Reform[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return [];
      }
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private setStoredReforms(reforms: Reform[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(reforms));
  }
}

// Once the central store reports itself unavailable, stay on
// localStorage for the rest of the session rather than hammering it.
let centralStoreUnavailable = false;

/** Test hook: reset the session-level availability flag. */
export function resetReformStoreAvailabilityForTesting(): void {
  centralStoreUnavailable = false;
}

/**
 * Tries the central store first and falls back to localStorage when it
 * is unconfigured (503) or absent — so the flagship shell works before
 * the database is provisioned. Real failures (500s, validation) still
 * surface to the caller. Reforms already in the localStorage fallback
 * stay there with their ids: lists show them beside the central ones,
 * and their edits stay local.
 */
export class ResilientReformStore implements ReformStore {
  constructor(
    private readonly api: ReformStore = new ApiReformStore(),
    private readonly local: ReformStore = new LocalStorageReformStore()
  ) {}

  private async withFallback<T>(
    viaApi: (store: ReformStore) => Promise<T>,
    viaLocal: (store: ReformStore) => Promise<T>
  ): Promise<T> {
    if (!centralStoreUnavailable) {
      try {
        return await viaApi(this.api);
      } catch (error) {
        if (!(error instanceof ReformStoreUnavailableError)) {
          throw error;
        }
        centralStoreUnavailable = true;
      }
    }
    return viaLocal(this.local);
  }

  /** Whether a reform lives in the localStorage fallback rather than centrally. */
  private async isLocal(reformId: string): Promise<boolean> {
    return (await this.local.findById(reformId)) !== null;
  }

  async create(reform: NewReform): Promise<Reform> {
    try {
      return await this.withFallback(
        (store) => store.create(reform),
        (store) => store.create(reform)
      );
    } catch (error) {
      if (error instanceof ReformStoreBusyError) {
        return this.local.create(reform);
      }
      throw error;
    }
  }

  async findMine(countryId?: string): Promise<Reform[]> {
    const local = await this.local.findMine(countryId);
    const central = await this.withFallback(
      (store) => store.findMine(countryId),
      async () => []
    );
    return [...central, ...local].sort(byMostRecentlyUpdated);
  }

  async findById(reformId: string): Promise<Reform | null> {
    const local = await this.local.findById(reformId);
    if (local) {
      return local;
    }
    return this.withFallback(
      (store) => store.findById(reformId),
      async () => null
    );
  }

  async update(reformId: string, updates: ReformUpdates): Promise<Reform> {
    if (await this.isLocal(reformId)) {
      return this.local.update(reformId, updates);
    }
    return this.withFallback(
      (store) => store.update(reformId, updates),
      (store) => store.update(reformId, updates)
    );
  }

  async delete(reformId: string): Promise<void> {
    if (await this.isLocal(reformId)) {
      return this.local.delete(reformId);
    }
    return this.withFallback(
      (store) => store.delete(reformId),
      (store) => store.delete(reformId)
    );
  }
}

export function getReformStore(): ReformStore {
  return getStoreBackend() === 'api' ? new ResilientReformStore() : new LocalStorageReformStore();
}

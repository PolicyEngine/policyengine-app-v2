import { ReformAdapter } from '@/adapters/ReformAdapter';
import { getStoreBackend } from '@/libs/storeBackend';
import { Reform } from '@/types/ingredients/Reform';
import { ReformMetadata } from '@/types/metadata/reformMetadata';

/**
 * Store for the flagship app's canonical reform objects.
 *
 * Reforms are user-owned, mutable content persisted centrally (unlike
 * canonical Policy records, which live in the main PolicyEngine API and
 * are immutable). The API implementation talks to /api/reforms, served
 * by Next.js route handlers backed by Postgres.
 */
export interface ReformStore {
  create: (reform: Omit<Reform, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Reform>;
  findByUser: (userId: string, countryId?: string) => Promise<Reform[]>;
  findById: (reformId: string) => Promise<Reform | null>;
  update: (
    reformId: string,
    updates: Partial<Omit<Reform, 'id' | 'userId' | 'countryId' | 'createdAt' | 'updatedAt'>>
  ) => Promise<Reform>;
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

export class ApiReformStore implements ReformStore {
  private readonly BASE_URL = '/api/reforms';

  async create(reform: Omit<Reform, 'id' | 'createdAt' | 'updatedAt'>): Promise<Reform> {
    const payload = ReformAdapter.toCreationPayload(reform);

    const response = await fetch(this.BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throwIfUnavailable(response);
      throw new Error('Failed to create reform');
    }

    const apiData: ReformMetadata = await response.json();
    return ReformAdapter.fromApiResponse(apiData);
  }

  async findByUser(userId: string, countryId?: string): Promise<Reform[]> {
    const params = new URLSearchParams({ user_id: userId });
    if (countryId) {
      params.set('country_id', countryId);
    }

    const response = await fetch(`${this.BASE_URL}?${params.toString()}`, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throwIfUnavailable(response);
      throw new Error('Failed to fetch reforms');
    }

    const apiData: ReformMetadata[] = await response.json();
    return apiData.map((item) => ReformAdapter.fromApiResponse(item));
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

  async update(
    reformId: string,
    updates: Partial<Omit<Reform, 'id' | 'userId' | 'countryId' | 'createdAt' | 'updatedAt'>>
  ): Promise<Reform> {
    const payload = ReformAdapter.toUpdatePayload(updates);

    const response = await fetch(`${this.BASE_URL}/${reformId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (response.status === 503) {
      throw new ReformStoreUnavailableError();
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
    });

    if (response.status === 503) {
      throw new ReformStoreUnavailableError();
    }

    if (!response.ok) {
      throw new Error('Failed to delete reform');
    }
  }
}

export class LocalStorageReformStore implements ReformStore {
  private readonly STORAGE_KEY = 'reforms';

  async create(reform: Omit<Reform, 'id' | 'createdAt' | 'updatedAt'>): Promise<Reform> {
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

  async findByUser(userId: string, countryId?: string): Promise<Reform[]> {
    return this.getStoredReforms().filter(
      (r) => r.userId === userId && (!countryId || r.countryId === countryId)
    );
  }

  async findById(reformId: string): Promise<Reform | null> {
    return this.getStoredReforms().find((r) => r.id === reformId) || null;
  }

  async update(
    reformId: string,
    updates: Partial<Omit<Reform, 'id' | 'userId' | 'countryId' | 'createdAt' | 'updatedAt'>>
  ): Promise<Reform> {
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
 * surface to the caller.
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

  create(reform: Omit<Reform, 'id' | 'createdAt' | 'updatedAt'>): Promise<Reform> {
    return this.withFallback(
      (store) => store.create(reform),
      (store) => store.create(reform)
    );
  }

  findByUser(userId: string, countryId?: string): Promise<Reform[]> {
    return this.withFallback(
      (store) => store.findByUser(userId, countryId),
      (store) => store.findByUser(userId, countryId)
    );
  }

  findById(reformId: string): Promise<Reform | null> {
    return this.withFallback(
      (store) => store.findById(reformId),
      (store) => store.findById(reformId)
    );
  }

  update(
    reformId: string,
    updates: Partial<Omit<Reform, 'id' | 'userId' | 'countryId' | 'createdAt' | 'updatedAt'>>
  ): Promise<Reform> {
    return this.withFallback(
      (store) => store.update(reformId, updates),
      (store) => store.update(reformId, updates)
    );
  }

  delete(reformId: string): Promise<void> {
    return this.withFallback(
      (store) => store.delete(reformId),
      (store) => store.delete(reformId)
    );
  }
}

export function getReformStore(): ReformStore {
  return getStoreBackend() === 'api' ? new ResilientReformStore() : new LocalStorageReformStore();
}

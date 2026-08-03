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
      throw new Error('Failed to fetch reforms');
    }

    const apiData: ReformMetadata[] = await response.json();
    return apiData.map((item) => ReformAdapter.fromApiResponse(item));
  }

  async findById(reformId: string): Promise<Reform | null> {
    const response = await fetch(`${this.BASE_URL}/${reformId}`, {
      headers: { 'Content-Type': 'application/json' },
    });

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

export function getReformStore(): ReformStore {
  return getStoreBackend() === 'api' ? new ApiReformStore() : new LocalStorageReformStore();
}

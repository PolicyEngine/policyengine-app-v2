/**
 * Usage Tracking Store
 *
 * A lightweight system for tracking "last used" timestamps for any ingredient
 * type (policies, households, geographies, etc.).
 *
 * This is separate from association data - it only tracks when items
 * were last accessed, not the items themselves.
 *
 * Usage:
 *   import { policyUsageStore } from '@/api/usageTracking';
 *
 *   // Record that a policy was used
 *   policyUsageStore.recordUsage(policyId);
 *
 *   // Get 5 most recently used policy IDs
 *   const recentIds = policyUsageStore.getRecentIds(5);
 */

import { canonicalRegionCode } from '@/models/region';

/** ISO timestamp string */
export type UsageData = Record<string, string>;

/** The ID as a store keeps it; most stores keep every ID as it is. */
type CanonicalId = (id: string) => string;

const keepId: CanonicalId = (id) => id;

/**
 * Generic store for tracking usage of items by ID.
 * Each ingredient type gets its own store instance with a unique storage key.
 */
export class UsageTrackingStore {
  constructor(
    private readonly storageKey: string,
    private readonly canonicalId: CanonicalId = keepId
  ) {}

  /**
   * Record that an item was used/accessed.
   * Updates the lastUsedAt timestamp.
   */
  recordUsage(id: string): string {
    const usage = this.getAll();
    const timestamp = new Date().toISOString();
    usage[this.canonicalId(id)] = timestamp;
    localStorage.setItem(this.storageKey, JSON.stringify(usage));
    return timestamp;
  }

  /**
   * Get all usage records (id -> lastUsedAt timestamp), each under its
   * canonical ID. Two stored IDs with one canonical ID become one record
   * with the later of their timestamps, the last time either was used.
   */
  getAll(): UsageData {
    let stored: unknown;
    try {
      const storedText = localStorage.getItem(this.storageKey);
      stored = storedText ? JSON.parse(storedText) : {};
    } catch {
      console.error(`[UsageTrackingStore] Failed to parse ${this.storageKey}`);
      return {};
    }
    if (!stored || typeof stored !== 'object') {
      return {};
    }

    const usage: UsageData = {};
    for (const [storedId, lastUsedAt] of Object.entries(stored as UsageData)) {
      const id = this.canonicalId(storedId);
      const otherLastUsedAt = usage[id];
      usage[id] = otherLastUsedAt && otherLastUsedAt > lastUsedAt ? otherLastUsedAt : lastUsedAt;
    }
    return usage;
  }

  /**
   * Get IDs sorted by most recently used.
   * @param limit Maximum number of IDs to return (default 10)
   */
  getRecentIds(limit = 10): string[] {
    const usage = this.getAll();
    return Object.entries(usage)
      .sort(([, a], [, b]) => b.localeCompare(a))
      .slice(0, limit)
      .map(([id]) => id);
  }

  /**
   * Get the last used timestamp for a specific ID.
   */
  getLastUsed(id: string): string | null {
    return this.getAll()[this.canonicalId(id)] || null;
  }

  /**
   * Check if an item has any usage recorded.
   */
  hasUsage(id: string): boolean {
    return !!this.getAll()[this.canonicalId(id)];
  }

  /**
   * Remove usage record for a specific ID.
   */
  removeUsage(id: string): void {
    const usage = this.getAll();
    delete usage[this.canonicalId(id)];
    localStorage.setItem(this.storageKey, JSON.stringify(usage));
  }

  /**
   * Clear all usage records for this store.
   */
  clear(): void {
    localStorage.removeItem(this.storageKey);
  }
}

// Pre-configured stores for each ingredient type
export const policyUsageStore = new UsageTrackingStore('policy-usage');
export const householdUsageStore = new UsageTrackingStore('household-usage');
// Geographies are region codes: one kept for "country/ni" reads as "country/northern_ireland".
export const geographyUsageStore = new UsageTrackingStore('geography-usage', canonicalRegionCode);
export const simulationUsageStore = new UsageTrackingStore('simulation-usage');
export const reportUsageStore = new UsageTrackingStore('report-usage');

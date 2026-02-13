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

/** ISO timestamp string */
export type UsageData = Record<string, string>;

/**
 * Generic store for tracking usage of items by ID.
 * Each ingredient type gets its own store instance with a unique storage key.
 */
export class UsageTrackingStore {
  constructor(private readonly storageKey: string) {}

  /**
   * Record that an item was used/accessed.
   * Updates the lastUsedAt timestamp.
   */
  recordUsage(id: string): string {
    const usage = this.getAll();
    const timestamp = new Date().toISOString();
    usage[id] = timestamp;
    localStorage.setItem(this.storageKey, JSON.stringify(usage));
    return timestamp;
  }

  /**
   * Get all usage records (id -> lastUsedAt timestamp).
   */
  getAll(): UsageData {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : {};
    } catch {
      console.error(`[UsageTrackingStore] Failed to parse ${this.storageKey}`);
      return {};
    }
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
    return this.getAll()[id] || null;
  }

  /**
   * Check if an item has any usage recorded.
   */
  hasUsage(id: string): boolean {
    return !!this.getAll()[id];
  }

  /**
   * Remove usage record for a specific ID.
   */
  removeUsage(id: string): void {
    const usage = this.getAll();
    delete usage[id];
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
export const geographyUsageStore = new UsageTrackingStore('geography-usage');
export const simulationUsageStore = new UsageTrackingStore('simulation-usage');
export const reportUsageStore = new UsageTrackingStore('report-usage');

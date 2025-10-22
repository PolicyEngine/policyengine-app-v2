import { QueryClient } from '@tanstack/react-query';

/**
 * Cache Monitor Utility
 *
 * Provides comprehensive logging for React Query cache operations
 * to help debug and verify staleTime/gcTime behavior
 */

interface CacheMonitorConfig {
  enabled: boolean;
  logFetches: boolean;
  logInvalidations: boolean;
  logGarbageCollection: boolean;
  logCacheState: boolean;
}

const defaultConfig: CacheMonitorConfig = {
  enabled: true,
  logFetches: true,
  logInvalidations: true,
  logGarbageCollection: true,
  logCacheState: false, // Can be noisy, enable for deep debugging
};

class CacheMonitor {
  private config: CacheMonitorConfig;
  private queryClient: QueryClient | null = null;
  private activeQueries: Map<string, { startTime: number; key: any[] }> = new Map();

  constructor(config: Partial<CacheMonitorConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  /**
   * Initialize the cache monitor with a QueryClient
   * Sets up event listeners to track cache operations
   */
  init(queryClient: QueryClient) {
    if (!this.config.enabled) return;

    this.queryClient = queryClient;

    // Set up QueryCache event listeners
    const cache = queryClient.getQueryCache();

    // Track when queries start fetching
    cache.subscribe((event) => {
      if (event.type === 'updated' && event.query.state.fetchStatus === 'fetching') {
        this.onQueryFetchStart(event.query);
      }

      // Track when queries finish fetching
      if (event.type === 'updated' && event.query.state.fetchStatus === 'idle') {
        this.onQueryFetchEnd(event.query);
      }

      // Track when queries are removed (garbage collected)
      if (event.type === 'removed') {
        this.onQueryRemoved(event.query);
      }
    });

    console.log('🔍 [CacheMonitor] Initialized - Tracking cache operations');
  }

  /**
   * Called when a query starts fetching
   */
  private onQueryFetchStart(query: any) {
    if (!this.config.logFetches) return;

    const key = this.getQueryKeyString(query.queryKey);
    const wasInvalidated = query.state.isInvalidated;

    this.activeQueries.set(key, {
      startTime: Date.now(),
      key: query.queryKey,
    });

    console.log(
      `🔄 [CacheMonitor] FETCH START: ${key}`,
      wasInvalidated ? '(INVALIDATED)' : '(STALE)',
      {
        queryKey: query.queryKey,
        dataUpdatedAt: new Date(query.state.dataUpdatedAt).toLocaleTimeString(),
        isInvalidated: query.state.isInvalidated,
      }
    );
  }

  /**
   * Called when a query finishes fetching
   */
  private onQueryFetchEnd(query: any) {
    if (!this.config.logFetches) return;

    const key = this.getQueryKeyString(query.queryKey);
    const active = this.activeQueries.get(key);

    if (active) {
      const duration = Date.now() - active.startTime;
      console.log(
        `✅ [CacheMonitor] FETCH END: ${key}`,
        `(${duration}ms)`,
        {
          queryKey: query.queryKey,
          hasData: !!query.state.data,
          hasError: !!query.state.error,
        }
      );
      this.activeQueries.delete(key);
    }
  }

  /**
   * Called when a query is removed from cache (garbage collected)
   */
  private onQueryRemoved(query: any) {
    if (!this.config.logGarbageCollection) return;

    const key = this.getQueryKeyString(query.queryKey);
    const dataAge = query.state.dataUpdatedAt
      ? ((Date.now() - query.state.dataUpdatedAt) / 1000).toFixed(1)
      : 'N/A';

    console.log(
      `🗑️ [CacheMonitor] GARBAGE COLLECTED: ${key}`,
      {
        queryKey: query.queryKey,
        dataAge: `${dataAge}s old`,
        hadData: !!query.state.data,
      }
    );
  }

  /**
   * Log when a query is manually invalidated
   */
  logInvalidation(queryKey: any, options?: any) {
    if (!this.config.logInvalidations) return;

    const key = this.getQueryKeyString(queryKey);
    console.log(
      `❌ [CacheMonitor] INVALIDATED: ${key}`,
      {
        queryKey,
        options,
        timestamp: new Date().toLocaleTimeString(),
      }
    );
  }

  /**
   * Get current cache state for debugging
   */
  getCacheState(): { [key: string]: any } {
    if (!this.queryClient) return {};

    const cache = this.queryClient.getQueryCache();
    const queries = cache.getAll();

    const state: { [key: string]: any } = {};

    queries.forEach((query) => {
      const key = this.getQueryKeyString(query.queryKey);
      state[key] = {
        queryKey: query.queryKey,
        hasData: !!query.state.data,
        dataUpdatedAt: new Date(query.state.dataUpdatedAt).toLocaleTimeString(),
        isStale: query.isStale(),
        isFetching: query.state.fetchStatus === 'fetching',
        isInvalidated: query.state.isInvalidated,
        observers: query.getObserversCount(),
      };
    });

    return state;
  }

  /**
   * Log current cache state
   */
  logCacheState(label?: string) {
    const state = this.getCacheState();
    const prefix = label ? `[${label}]` : '';
    console.log(`📊 [CacheMonitor] ${prefix} Cache State:`, state);
  }

  /**
   * Log navigation event
   */
  logNavigation(from: string, to: string) {
    console.log(`🧭 [CacheMonitor] NAVIGATION: ${from} → ${to}`);

    if (this.config.logCacheState) {
      setTimeout(() => {
        this.logCacheState('After Navigation');
      }, 100);
    }
  }

  /**
   * Helper to convert query key array to readable string
   */
  private getQueryKeyString(queryKey: readonly unknown[]): string {
    if (!Array.isArray(queryKey)) return String(queryKey);

    // Handle common patterns
    if (queryKey[0] === 'simulations' && queryKey[1] === 'simulation_id') {
      return `simulation:${queryKey[2]}`;
    }
    if (queryKey[0] === 'reports' && queryKey[1] === 'report_id') {
      return `report:${queryKey[2]}`;
    }
    if (queryKey[0] === 'calculations') {
      return `calc:${queryKey[1]}:${queryKey[2]}`;
    }

    return queryKey.join(':');
  }

  /**
   * Monitor specific simulation IDs
   */
  monitorSimulations(simulationIds: string[]) {
    if (!this.queryClient) return;

    console.log(`👁️ [CacheMonitor] Monitoring simulations:`, simulationIds);

    const cache = this.queryClient.getQueryCache();
    const queries = cache.getAll();

    const relevantQueries = queries.filter((q) =>
      q.queryKey[0] === 'simulations' && simulationIds.includes(q.queryKey[2] as string)
    );

    relevantQueries.forEach((query) => {
      const key = this.getQueryKeyString(query.queryKey);
      console.log(`  📌 ${key}:`, {
        hasData: !!query.state.data,
        isStale: query.isStale(),
        isFetching: query.state.fetchStatus === 'fetching',
        observers: query.getObserversCount(),
        dataAge: query.state.dataUpdatedAt
          ? `${((Date.now() - query.state.dataUpdatedAt) / 1000).toFixed(1)}s`
          : 'N/A',
      });
    });
  }

  /**
   * Get statistics about cache usage
   */
  getStats() {
    if (!this.queryClient) return null;

    const cache = this.queryClient.getQueryCache();
    const queries = cache.getAll();

    const stats = {
      total: queries.length,
      fetching: queries.filter(q => q.state.fetchStatus === 'fetching').length,
      stale: queries.filter(q => q.isStale()).length,
      fresh: queries.filter(q => !q.isStale()).length,
      withData: queries.filter(q => !!q.state.data).length,
      withObservers: queries.filter(q => q.getObserversCount() > 0).length,
      orphaned: queries.filter(q => q.getObserversCount() === 0).length,
    };

    console.log('📈 [CacheMonitor] Stats:', stats);
    return stats;
  }
}

// Export singleton instance
export const cacheMonitor = new CacheMonitor();

/**
 * Hook to use cache monitor in components
 */
export function useCacheMonitor() {
  return {
    logCacheState: (label?: string) => cacheMonitor.logCacheState(label),
    monitorSimulations: (simulationIds: string[]) => cacheMonitor.monitorSimulations(simulationIds),
    getStats: () => cacheMonitor.getStats(),
  };
}

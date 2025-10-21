import { useQueryNormalizer } from '@normy/react-query';
import { useQueries, useQueryClient, UseQueryResult } from '@tanstack/react-query';

/**
 * Generic interface for normalized data structure
 */
export interface NormalizedData<T extends Record<string, any> = Record<string, any>> {
  entities: T;
  result: string[];
  isLoading: boolean;
  error: Error | null;
}

/**
 * Configuration for fetching and caching data
 */
export interface FetchConfig<T> {
  queryKey: (id: string) => readonly any[] | any[];
  queryFn: (id: string) => Promise<T>;
  enabled?: boolean;
  staleTime?: number;
}

/**
 * Result of parallel queries with combined loading/error states
 */
export interface ParallelQueriesResult<T> {
  queries: UseQueryResult<T, Error>[];
  isLoading: boolean;
  error: Error | null;
}

/**
 * Generic hook for fetching multiple items in parallel with caching
 * @param ids Array of IDs to fetch
 * @param config Configuration for fetching and caching
 * @returns Combined query results with loading and error states
 */
export function useParallelQueries<T>(
  ids: string[],
  config: FetchConfig<T>
): ParallelQueriesResult<T> {
  const queryClient = useQueryClient();

  const queries = useQueries({
    queries: ids.map((id) => ({
      queryKey: config.queryKey(id),
      queryFn: async () => {
        // Check cache first
        const cached = queryClient.getQueryData(config.queryKey(id));

        console.log(`[useParallelQueries] queryFn called for ID: ${id}`);
        console.log(`[useParallelQueries] Cache check result:`, {
          hasCached: !!cached,
          cachedValue: cached,
        });

        if (cached) {
          console.log(`[useParallelQueries] Returning cached data for ${id} (NOT fetching from API)`);
          return cached as T;
        }

        console.log(`[useParallelQueries] No cache found, calling config.queryFn for ${id}`);
        // Fetch from API
        const freshData = await config.queryFn(id);
        console.log(`[useParallelQueries] Fresh data fetched for ${id}:`, freshData);
        return freshData;
      },
      enabled: config.enabled !== false,
      staleTime: config.staleTime ?? 5 * 60 * 1000, // Default 5 minutes (use ?? to allow 0)
    })),
  });

  const isLoading = queries.some((q) => q.isLoading);
  const error = queries.find((q) => q.error)?.error || null;

  return { queries, isLoading, error };
}

/**
 * Combines loading and error states from multiple sources
 */
export function combineLoadingStates(
  ...states: Array<{ isLoading?: boolean; error?: Error | null }>
): { isLoading: boolean; error: Error | null } {
  const isLoading = states.some((s) => s.isLoading);
  const error = states.find((s) => s.error)?.error || null;
  return { isLoading, error: error as Error | null };
}

/**
 * Hook for accessing normalized data via @normy/react-query
 */
export function useNormalizedData<T>(_entityKey: string, id: string): T | null {
  const queryNormalizer = useQueryNormalizer();
  return queryNormalizer.getObjectById(id) || null;
}

/**
 * Hook for getting all entities of a type
 */
export function useAllEntities<T>(entityKey: string): T[] {
  const queryNormalizer = useQueryNormalizer();
  const data = queryNormalizer.getNormalizedData(entityKey);
  return data ? Object.values(data) : [];
}

/**
 * Hook for searching entities by a specific field
 */
export function useSearchEntities<T extends Record<string, any>>(
  entityKey: string,
  searchField: keyof T,
  searchTerm: string
): T[] {
  const entities = useAllEntities<T>(entityKey);

  if (!searchTerm) {
    return entities;
  }

  const lowerSearchTerm = searchTerm.toLowerCase();
  return entities.filter((entity) =>
    entity[searchField]?.toString().toLowerCase().includes(lowerSearchTerm)
  );
}

/**
 * Helper to extract unique IDs from an array of objects
 */
export function extractUniqueIds<T extends { [key: string]: any }>(
  items: T[],
  idField: keyof T
): string[] {
  const ids = new Set<string>();
  items.forEach((item) => {
    const id = item[idField];
    if (id != null) {
      ids.add(id.toString());
    }
  });
  return Array.from(ids);
}

/**
 * Helper to create a lookup map from an array of objects
 */
export function createLookupMap<T extends { id: string | number }>(items: T[]): Record<string, T> {
  const map: Record<string, T> = {};
  items.forEach((item) => {
    if (item?.id != null) {
      map[item.id.toString()] = item;
    }
  });
  return map;
}

/**
 * Safe getter for nested entity references using @normy/react-query
 */
export function useNestedEntity<T>(
  entityType: string,
  id: string | number | undefined | null
): T | null {
  const queryNormalizer = useQueryNormalizer();

  if (id == null) {
    return null;
  }

  const entities = queryNormalizer.getNormalizedData(entityType);
  return entities?.[id.toString()] || null;
}

/**
 * Hook to get related entities through a junction table
 */
export function useRelatedEntity<T, U>(
  primaryEntityKey: string,
  relatedEntityKey: string,
  relationshipField: keyof T,
  id: string
): U | null {
  const queryNormalizer = useQueryNormalizer();

  const primaryEntities = queryNormalizer.getNormalizedData(primaryEntityKey);
  const primaryEntity = primaryEntities?.[id];

  if (!primaryEntity) {
    return null;
  }

  const relatedId = primaryEntity[relationshipField];
  if (!relatedId) {
    return null;
  }

  const relatedEntities = queryNormalizer.getNormalizedData(relatedEntityKey);
  return relatedEntities?.[relatedId] || null;
}

/**
 * Hook for manual data normalization updates
 */
export function useManualNormalization() {
  const queryNormalizer = useQueryNormalizer();

  return {
    updateEntity: <T extends { id: string | number }>(entityKey: string, entity: T) => {
      queryNormalizer.setNormalizedData({
        [entityKey]: {
          [entity.id]: entity,
        },
      });
    },
    updateEntities: <T extends { id: string | number }>(entityKey: string, entities: T[]) => {
      const normalized: Record<string, T> = {};
      entities.forEach((entity) => {
        normalized[entity.id] = entity;
      });
      queryNormalizer.setNormalizedData({
        [entityKey]: normalized,
      });
    },
  };
}

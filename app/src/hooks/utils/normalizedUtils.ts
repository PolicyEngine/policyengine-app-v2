import { UseQueryResult, useQueries, useQueryClient } from '@tanstack/react-query';
import { normalize, denormalize, Schema } from 'normy';

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
        if (cached) {
          return cached as T;
        }
        // Fetch from API
        return config.queryFn(id);
      },
      enabled: config.enabled !== false,
      staleTime: config.staleTime || 5 * 60 * 1000, // Default 5 minutes
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
 * Generic normalization function with error handling
 */
export function normalizeData<T>(
  data: T[],
  schema: Schema | Schema[],
  isLoading: boolean,
  error: Error | null
): NormalizedData {
  if (isLoading || error || data.length === 0) {
    return {
      entities: {},
      result: [],
      isLoading,
      error,
    };
  }

  const normalized = normalize(data, schema);
  return {
    ...normalized,
    isLoading,
    error,
  } as NormalizedData;
}

/**
 * Creates a denormalization helper function for a specific entity type
 */
export function createDenormalizer<T>(
  entityKey: string,
  schema: Schema
) {
  return (id: string, entities: Record<string, any>): T | null => {
    if (!entities[entityKey]?.[id]) return null;
    return denormalize(id, schema, entities) as T;
  };
}

/**
 * Creates a batch denormalization helper function
 */
export function createBatchDenormalizer<T>(
  entityKey: string
) {
  return (entities: Record<string, any>): T[] => {
    const entityMap = entities[entityKey];
    if (!entityMap) return [];
    return Object.values(entityMap) as T[];
  };
}

/**
 * Creates a search function for entities by a specific field
 */
export function createSearchFunction<T extends Record<string, any>>(
  entityKey: string,
  searchField: keyof T
) {
  return (entities: Record<string, any>, searchTerm: string): T[] => {
    const entityMap = entities[entityKey];
    if (!entityMap) return [];
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    return Object.values(entityMap).filter((entity: any) => 
      entity[searchField]?.toString().toLowerCase().includes(lowerSearchTerm)
    ) as T[];
  };
}

/**
 * Merges multiple entity collections, preserving existing data
 */
export function mergeEntities(
  ...entityCollections: Array<Record<string, Record<string, any>>>
): Record<string, Record<string, any>> {
  const merged: Record<string, Record<string, any>> = {};

  for (const collection of entityCollections) {
    for (const [entityType, entities] of Object.entries(collection)) {
      if (!merged[entityType]) {
        merged[entityType] = {};
      }
      Object.assign(merged[entityType], entities);
    }
  }

  return merged;
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
export function createLookupMap<T extends { id: string | number }>(
  items: T[]
): Record<string, T> {
  const map: Record<string, T> = {};
  items.forEach((item) => {
    if (item?.id != null) {
      map[item.id.toString()] = item;
    }
  });
  return map;
}

/**
 * Safe getter for nested entity references
 */
export function getNestedEntity<T>(
  entities: Record<string, any>,
  entityType: string,
  id: string | number | undefined | null
): T | null {
  if (id == null) return null;
  return entities[entityType]?.[id.toString()] || null;
}

/**
 * Creates a helper to get related entities through a junction table
 */
export function createRelationshipGetter<T, U>(
  primaryEntityKey: string,
  relatedEntityKey: string,
  relationshipField: keyof T
) {
  return (
    id: string,
    entities: Record<string, any>
  ): U | null => {
    const primaryEntity = entities[primaryEntityKey]?.[id];
    if (!primaryEntity) return null;
    
    const relatedId = primaryEntity[relationshipField];
    if (!relatedId) return null;
    
    return entities[relatedEntityKey]?.[relatedId] || null;
  };
}
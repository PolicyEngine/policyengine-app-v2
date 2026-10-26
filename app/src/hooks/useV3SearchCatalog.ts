import { useCallback, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { fetchParameterSearchFile } from '@/api/publicApi/searchFile';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useFlagshipMetadataStatus } from '@/hooks/useFlagshipMetadataStatus';
import { buildV2SearchCatalog } from '@/libs/flagship/v2ParameterSearch';
import { V3_API_ROUTES } from '@/libs/flagship/v3ApiRoutes';
import {
  createParameterSearchIndex,
  selectAddableParameterPaths,
  selectConceptClusters,
  selectParameterEntriesByPath,
  selectParameterSearchEntries,
  selectParameterSearchIndex,
  type ParameterSearchEntry,
  type ParameterSearchIndex,
} from '@/libs/parameterSearch';
import type { RootState } from '@/store';

/**
 * What v3's parameter search, add bar and draft editor read about which
 * parameters a reform can take: search entries and their index, the
 * addable paths, concept clusters, and each path's label.
 *
 * On the v1 routes these come from the whole metadata (as before). On the
 * v2 routes they come from the catalog version's search file, which loads
 * in the background once the small model catalog is in; until it arrives
 * the status is 'loading' and nothing is offered.
 */
export interface V3SearchCatalog {
  status: 'loading' | 'error' | 'ready';
  /** The failure's message, when the status is 'error'. */
  message: string | null;
  retry: () => unknown;
  entries: ParameterSearchEntry[];
  index: ParameterSearchIndex;
  entriesByPath: Map<string, ParameterSearchEntry>;
  addablePaths: Set<string>;
  clusters: string[][];
  /** A parameter's or node's own label, or null when it has none. */
  labelFor: (path: string) => string | null;
}

const NO_ENTRIES: ParameterSearchEntry[] = [];
const NO_INDEX: ParameterSearchIndex = createParameterSearchIndex([]);
const NO_ENTRIES_BY_PATH = new Map<string, ParameterSearchEntry>();
const NO_PATHS = new Set<string>();
const NO_CLUSTERS: string[][] = [];

/** The query key of a catalog version's search file. */
export function v2SearchFileKey(countryId: string, policyengineVersion: string | null | undefined) {
  return ['v2-parameter-search-file', countryId, policyengineVersion] as const;
}

/** A catalog version's file never changes, so it is fetched once per session. */
const SEARCH_FILE_QUERY_OPTIONS = { staleTime: Infinity, gcTime: Infinity } as const;

function useV1SearchCatalog(): V3SearchCatalog {
  const metadata = useFlagshipMetadataStatus();
  const entries = useSelector(selectParameterSearchEntries);
  const index = useSelector(selectParameterSearchIndex);
  const entriesByPath = useSelector(selectParameterEntriesByPath);
  const addablePaths = useSelector(selectAddableParameterPaths);
  const clusters = useSelector(selectConceptClusters);
  const parameters = useSelector((state: RootState) => state.metadata.parameters);
  const labelFor = useCallback((path: string) => parameters?.[path]?.label ?? null, [parameters]);
  const status = entries.length > 0 ? 'ready' : metadata.status === 'error' ? 'error' : 'loading';
  return {
    status,
    message: status === 'error' ? metadata.message : null,
    retry: metadata.retry,
    entries,
    index,
    entriesByPath,
    addablePaths,
    clusters,
    labelFor,
  };
}

/** The current catalog version's PolicyEngine.py version, once the model catalog is in. */
function useV2CatalogVersion(): string | null {
  return useSelector((state: RootState) =>
    state.metadata.routes === 'v2' ? (state.metadata.v2Catalog?.policyengineVersion ?? null) : null
  );
}

function useV2SearchCatalog(): V3SearchCatalog {
  const countryId = useCurrentCountry();
  const metadata = useFlagshipMetadataStatus();
  const policyengineVersion = useV2CatalogVersion();
  const query = useQuery({
    queryKey: v2SearchFileKey(countryId, policyengineVersion),
    queryFn: () => fetchParameterSearchFile(countryId, policyengineVersion!),
    enabled: policyengineVersion !== null,
    ...SEARCH_FILE_QUERY_OPTIONS,
  });
  const catalog = useMemo(
    () => (query.data ? buildV2SearchCatalog(query.data) : null),
    [query.data]
  );
  const labelFor = useCallback(
    (path: string) => catalog?.collection[path]?.label ?? null,
    [catalog]
  );

  if (metadata.status === 'error') {
    return emptyCatalog('error', metadata.message, metadata.retry, labelFor);
  }
  if (query.isError) {
    return emptyCatalog(
      'error',
      query.error instanceof Error ? query.error.message : null,
      query.refetch,
      labelFor
    );
  }
  if (!catalog) {
    return emptyCatalog('loading', null, query.refetch, labelFor);
  }
  return {
    status: 'ready',
    message: null,
    retry: query.refetch,
    entries: catalog.entries,
    index: catalog.index,
    entriesByPath: catalog.entriesByPath,
    addablePaths: catalog.addablePaths,
    clusters: catalog.clusters,
    labelFor,
  };
}

function emptyCatalog(
  status: 'loading' | 'error',
  message: string | null,
  retry: () => unknown,
  labelFor: (path: string) => string | null
): V3SearchCatalog {
  return {
    status,
    message,
    retry,
    entries: NO_ENTRIES,
    index: NO_INDEX,
    entriesByPath: NO_ENTRIES_BY_PATH,
    addablePaths: NO_PATHS,
    clusters: NO_CLUSTERS,
    labelFor,
  };
}

/**
 * The search catalog for the routes v3 uses (V3_API_ROUTES, a constant, so
 * every render calls the same hooks).
 */
export const useV3SearchCatalog: () => V3SearchCatalog =
  V3_API_ROUTES === 'v2' ? useV2SearchCatalog : useV1SearchCatalog;

/**
 * Starts the search file's download once a v3 page has rendered, so it is
 * in by the time someone searches. Nothing on the v1 routes, where the
 * whole metadata already holds what search reads.
 */
function useV2SearchFileInBackground(): void {
  const countryId = useCurrentCountry();
  const policyengineVersion = useV2CatalogVersion();
  const queryClient = useQueryClient();
  useEffect(() => {
    if (policyengineVersion === null) {
      return;
    }
    void queryClient.prefetchQuery({
      queryKey: v2SearchFileKey(countryId, policyengineVersion),
      queryFn: () => fetchParameterSearchFile(countryId, policyengineVersion),
      ...SEARCH_FILE_QUERY_OPTIONS,
    });
  }, [countryId, policyengineVersion, queryClient]);
}

function noBackgroundLoad(): void {}

export const useV3SearchFileInBackground: () => void =
  V3_API_ROUTES === 'v2' ? useV2SearchFileInBackground : noBackgroundLoad;

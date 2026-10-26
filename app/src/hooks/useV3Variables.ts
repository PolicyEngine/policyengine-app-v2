import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCatalogVariables } from '@/api/publicApi/catalogVariables';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useFlagshipMetadataStatus } from '@/hooks/useFlagshipMetadataStatus';
import { V3_API_ROUTES } from '@/libs/flagship/v3ApiRoutes';
import { catalogVariablesLoaded } from '@/reducers/metadataReducer';
import type { AppDispatch, RootState } from '@/store';

/**
 * Whether every variable of the model is in the metadata store
 * (`state.metadata.variables`), for the v3 views that read them: the
 * household builder and its variable picker, the household breakdown,
 * provision and change lists that name variables, and calibration matches.
 *
 * On the v1 routes the whole metadata holds every variable, so they are
 * ready once it is. On the v2 routes the store starts with none: all of
 * the catalog version's variables load once, in the background, after a
 * v3 page renders, and views that read them show their loading state until
 * they are in, with no time limit.
 */
export interface V3VariablesStatus {
  status: 'loading' | 'error' | 'ready';
  /**
   * Whether the variables are being loaded right now: only ever on the v2
   * routes. On v1, 'loading' means the whole metadata is not in yet, which
   * views that never waited for it before can ignore.
   */
  waiting: boolean;
  /** The failure's message, when the status is 'error'. */
  message: string | null;
  retry: () => unknown;
}

/** The query key of a catalog version's variables. */
export function v2CatalogVariablesKey(countryId: string, policyengineVersion: string | null) {
  return ['v2-catalog-variables', countryId, policyengineVersion] as const;
}

/** A catalog version's variables never change, so they are fetched once per session. */
const VARIABLES_QUERY_OPTIONS = { staleTime: Infinity, gcTime: Infinity } as const;

function useV2CatalogVersion(): string | null {
  return useSelector((state: RootState) =>
    state.metadata.routes === 'v2' ? (state.metadata.v2Catalog?.policyengineVersion ?? null) : null
  );
}

function useV1Variables(): V3VariablesStatus {
  const metadata = useFlagshipMetadataStatus();
  return {
    status: metadata.status,
    waiting: false,
    message: metadata.message,
    retry: metadata.retry,
  };
}

function useV2Variables(): V3VariablesStatus {
  const countryId = useCurrentCountry();
  const dispatch = useDispatch<AppDispatch>();
  const metadata = useFlagshipMetadataStatus();
  const policyengineVersion = useV2CatalogVersion();
  const loadedVersion = useSelector((state: RootState) => state.metadata.v2VariablesVersion);
  const inStore = policyengineVersion !== null && loadedVersion === policyengineVersion;
  const query = useQuery({
    queryKey: v2CatalogVariablesKey(countryId, policyengineVersion),
    queryFn: () => fetchCatalogVariables(countryId, policyengineVersion!),
    enabled: policyengineVersion !== null,
    ...VARIABLES_QUERY_OPTIONS,
  });

  // The query holds the response; the store holds what views read. They
  // part only when the store is cleared (a country change) while the query
  // is cached, so the store is filled from the cache whenever it lacks them.
  useEffect(() => {
    if (query.data && policyengineVersion !== null && !inStore) {
      dispatch(catalogVariablesLoaded({ countryId, policyengineVersion, ...query.data }));
    }
  }, [query.data, policyengineVersion, inStore, countryId, dispatch]);

  if (inStore) {
    return { status: 'ready', waiting: false, message: null, retry: query.refetch };
  }
  if (metadata.status === 'error') {
    return { status: 'error', waiting: false, message: metadata.message, retry: metadata.retry };
  }
  if (query.isError) {
    return {
      status: 'error',
      waiting: false,
      message: query.error instanceof Error ? query.error.message : null,
      retry: query.refetch,
    };
  }
  return { status: 'loading', waiting: true, message: null, retry: query.refetch };
}

/**
 * Whether the model's variables are in the metadata store for the routes v3
 * uses (V3_API_ROUTES, a constant, so every render calls the same hooks); on
 * the v2 routes, loads them if they are not.
 */
export const useV3Variables: () => V3VariablesStatus =
  V3_API_ROUTES === 'v2' ? useV2Variables : useV1Variables;

/**
 * Starts loading the catalog version's variables once a v3 page has
 * rendered, so they are in by the time a household is built or broken
 * down. Nothing on the v1 routes, where the whole metadata holds them.
 */
function useV2VariablesInBackground(): void {
  const countryId = useCurrentCountry();
  const policyengineVersion = useV2CatalogVersion();
  const queryClient = useQueryClient();
  useEffect(() => {
    if (policyengineVersion === null) {
      return;
    }
    void queryClient.prefetchQuery({
      queryKey: v2CatalogVariablesKey(countryId, policyengineVersion),
      queryFn: () => fetchCatalogVariables(countryId, policyengineVersion),
      ...VARIABLES_QUERY_OPTIONS,
    });
  }, [countryId, policyengineVersion, queryClient]);
}

function noBackgroundLoad(): void {}

export const useV3VariablesInBackground: () => void =
  V3_API_ROUTES === 'v2' ? useV2VariablesInBackground : noBackgroundLoad;

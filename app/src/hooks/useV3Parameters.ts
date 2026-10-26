import { useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useDispatch, useSelector, useStore } from 'react-redux';
import { fetchCatalogParameters } from '@/api/publicApi/catalogParameters';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useFlagshipMetadataStatus } from '@/hooks/useFlagshipMetadataStatus';
import { V3_API_ROUTES } from '@/libs/flagship/v3ApiRoutes';
import { catalogParametersLoaded } from '@/reducers/metadataReducer';
import type { AppDispatch, RootState } from '@/store';

/**
 * Parameters with their current-law values, for the v3 views that read
 * them from the metadata store (`state.metadata.parameters`).
 *
 * On the v1 routes the whole metadata holds every parameter, so they are
 * ready once it is. On the v2 routes the store starts with none: a view
 * names what it shows (a reform's parameters, a report's changes) and
 * those load in one request, with the labels of the nodes above them; the
 * view shows its loading state until they are in. Names the catalog
 * version does not have count as loaded, so nothing asks for them again.
 */
export interface V3ParametersStatus {
  status: 'loading' | 'error' | 'ready';
  /** The failure's message, when the status is 'error'. */
  message: string | null;
  retry: () => unknown;
}

/** How long a batch's query stays cached without a reader; its parameters stay in the store. */
const PARAMETER_QUERY_GC_TIME = 5 * 60 * 1000;

function catalogParametersKey(
  countryId: string,
  policyengineVersion: string | null,
  names: readonly string[]
) {
  return ['v2-catalog-parameters', countryId, policyengineVersion, ...names] as const;
}

function selectV2CatalogVersion(state: RootState): string | null {
  return state.metadata.routes === 'v2'
    ? (state.metadata.v2Catalog?.policyengineVersion ?? null)
    : null;
}

/** Which of `names` the store lacks values for, sorted, each once. */
function namesToLoad(
  parameters: RootState['metadata']['parameters'],
  missingNames: readonly string[] | undefined,
  names: readonly string[]
): string[] {
  const missing = new Set(missingNames ?? []);
  return [...new Set(names)]
    .filter((name) => parameters[name]?.values === undefined && !missing.has(name))
    .sort();
}

async function loadIntoStore(
  dispatch: AppDispatch,
  countryId: string,
  policyengineVersion: string,
  names: readonly string[]
): Promise<true> {
  const loaded = await fetchCatalogParameters(countryId, policyengineVersion, names);
  dispatch(catalogParametersLoaded({ countryId, policyengineVersion, ...loaded }));
  return true;
}

function useV1EnsureParameters(_names: readonly string[]): V3ParametersStatus {
  const metadata = useFlagshipMetadataStatus();
  return { status: metadata.status, message: metadata.message, retry: metadata.retry };
}

function useV2EnsureParameters(names: readonly string[]): V3ParametersStatus {
  const countryId = useCurrentCountry();
  const dispatch = useDispatch<AppDispatch>();
  const metadata = useFlagshipMetadataStatus();
  const policyengineVersion = useSelector(selectV2CatalogVersion);
  const parameters = useSelector((state: RootState) => state.metadata.parameters);
  const missingNames = useSelector((state: RootState) => state.metadata.v2MissingParameterNames);
  const toLoad = useMemo(
    () => namesToLoad(parameters, missingNames, names),
    [names, parameters, missingNames]
  );
  const query = useQuery({
    queryKey: catalogParametersKey(countryId, policyengineVersion, toLoad),
    queryFn: () => loadIntoStore(dispatch, countryId, policyengineVersion!, toLoad),
    enabled: policyengineVersion !== null && toLoad.length > 0,
    staleTime: Infinity,
    gcTime: PARAMETER_QUERY_GC_TIME,
  });

  if (toLoad.length === 0) {
    return { status: 'ready', message: null, retry: metadata.retry };
  }
  if (metadata.status === 'error') {
    return { status: 'error', message: metadata.message, retry: metadata.retry };
  }
  if (query.isError) {
    return {
      status: 'error',
      message: query.error instanceof Error ? query.error.message : null,
      retry: query.refetch,
    };
  }
  return { status: 'loading', message: null, retry: query.refetch };
}

/**
 * Whether the named parameters, with their values, are in the metadata
 * store for the routes v3 uses (V3_API_ROUTES, a constant, so every render
 * calls the same hooks); on the v2 routes, loads those that are not.
 */
export const useEnsureV3Parameters: (names: readonly string[]) => V3ParametersStatus =
  V3_API_ROUTES === 'v2' ? useV2EnsureParameters : useV1EnsureParameters;

function useV1LoadParameters(): (names: readonly string[]) => Promise<void> {
  return useCallback(async () => {}, []);
}

function useV2LoadParameters(): (names: readonly string[]) => Promise<void> {
  const countryId = useCurrentCountry();
  const dispatch = useDispatch<AppDispatch>();
  const store = useStore<RootState>();
  const queryClient = useQueryClient();
  return useCallback(
    async (names: readonly string[]) => {
      const state = store.getState();
      const policyengineVersion = selectV2CatalogVersion(state);
      const toLoad = namesToLoad(
        state.metadata.parameters,
        state.metadata.v2MissingParameterNames,
        names
      );
      if (policyengineVersion === null || toLoad.length === 0) {
        return;
      }
      await queryClient.fetchQuery({
        queryKey: catalogParametersKey(countryId, policyengineVersion, toLoad),
        queryFn: () => loadIntoStore(dispatch, countryId, policyengineVersion, toLoad),
        staleTime: Infinity,
        gcTime: PARAMETER_QUERY_GC_TIME,
      });
    },
    [countryId, dispatch, store, queryClient]
  );
}

/**
 * A function that loads the named parameters into the store and resolves
 * once they are in (at once on the v1 routes, where they always are), for
 * actions such as adding a parameter to a draft.
 */
export const useLoadV3Parameters: () => (names: readonly string[]) => Promise<void> =
  V3_API_ROUTES === 'v2' ? useV2LoadParameters : useV1LoadParameters;

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCatalogVariables } from '@/api/publicApi/catalogVariables';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useFlagshipMetadataStatus } from '@/hooks/useFlagshipMetadataStatus';
import { V3_API_ROUTES } from '@/libs/flagship/v3ApiRoutes';
import {
  catalogVariablesLoaded,
  selectV2CatalogVersion,
  selectV2LoadId,
} from '@/reducers/metadataReducer';
import type { AppDispatch, RootState } from '@/store';

/**
 * Whether every variable of the model is in the metadata store
 * (`state.metadata.variables`), for the v3 views that read them: the
 * household builder and its variable picker, the household breakdown,
 * provision and change lists that name variables, programme names and
 * calibration matches.
 *
 * On the v1 routes the whole metadata holds every variable, and the pages
 * handle its loading as before, so for these views the variables are always
 * 'ready'. On the v2 routes the store starts with none: all of the catalog
 * version's variables load once per model catalog load, in the background,
 * and views show their loading state while they are 'waiting' (with no time
 * limit), or say they 'failed' and offer `retry`.
 */
export interface V3VariablesStatus {
  state: 'ready' | 'waiting' | 'failed';
  /** The failure's message, when the state is 'failed'. */
  message: string | null;
  retry: () => unknown;
}

/**
 * The query key of a catalog version's variables, under one load of the
 * model catalog: a new load (a retry, or a newer catalog) empties the store
 * and asks for them again.
 */
export function v2CatalogVariablesKey(
  countryId: string,
  policyengineVersion: string | null,
  loadId: string | null
) {
  return [V2_CATALOG_VARIABLES, countryId, policyengineVersion, loadId] as const;
}

const V2_CATALOG_VARIABLES = 'v2-catalog-variables';

/** What a variables load is for: the page's country and the store's current model catalog load. */
interface VariablesTarget {
  countryId: string;
  policyengineVersion: string | null;
  loadId: string | null;
  /** The store already holds the variables of this load. */
  inStore: boolean;
  /**
   * Whether to ask for them: not when the store holds them already, and not
   * for a model catalog of another country than the page's (a country
   * change in flight).
   */
  enabled: boolean;
}

function useV2VariablesTarget(): VariablesTarget {
  const countryId = useCurrentCountry();
  const storeCountry = useSelector((state: RootState) => state.metadata.currentCountry);
  const policyengineVersion = useSelector(selectV2CatalogVersion);
  const loadId = useSelector(selectV2LoadId);
  const loadedUnder = useSelector((state: RootState) => state.metadata.v2VariablesLoadId);
  const inStore = loadId !== null && loadedUnder === loadId;
  return {
    countryId,
    policyengineVersion,
    loadId,
    inStore,
    enabled:
      !inStore && policyengineVersion !== null && loadId !== null && storeCountry === countryId,
  };
}

/**
 * The one query both the readers and the background load use: it fetches
 * the catalog version's variables and puts them in the store, under the
 * load they were asked for (a response for an earlier load is dropped).
 * A catalog version's variables never change, so it is never stale, and the
 * current load's entry is kept for the session (`gcTime: Infinity`); an
 * earlier load's entry is removed when a new load starts (see
 * useV2VariablesInBackground), so only one load's variables stay cached.
 */
function catalogVariablesQuery(dispatch: AppDispatch, target: VariablesTarget) {
  const { countryId, policyengineVersion, loadId } = target;
  return {
    queryKey: v2CatalogVariablesKey(countryId, policyengineVersion, loadId),
    queryFn: async () => {
      const loaded = await fetchCatalogVariables(countryId, policyengineVersion!);
      dispatch(
        catalogVariablesLoaded({
          countryId,
          policyengineVersion: policyengineVersion!,
          loadId: loadId!,
          ...loaded,
        })
      );
      return loaded;
    },
    staleTime: Infinity,
    gcTime: Infinity,
  };
}

function useV1Variables(): V3VariablesStatus {
  const metadata = useFlagshipMetadataStatus();
  return { state: 'ready', message: null, retry: metadata.retry };
}

function useV2Variables(): V3VariablesStatus {
  const dispatch = useDispatch<AppDispatch>();
  const metadata = useFlagshipMetadataStatus();
  const target = useV2VariablesTarget();
  const query = useQuery({ ...catalogVariablesQuery(dispatch, target), enabled: target.enabled });

  if (target.inStore) {
    return { state: 'ready', message: null, retry: query.refetch };
  }
  if (metadata.status === 'error') {
    return { state: 'failed', message: metadata.message, retry: metadata.retry };
  }
  if (query.isError) {
    return {
      state: 'failed',
      message: query.error instanceof Error ? query.error.message : null,
      retry: query.refetch,
    };
  }
  return { state: 'waiting', message: null, retry: query.refetch };
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
 * rendered, so they are in the store by the time a household is built or
 * broken down, also for views that read `state.metadata.variables` without
 * `useV3Variables`. An earlier model catalog load's query is removed first,
 * so only the current load's variables stay cached. Nothing when the store's
 * model catalog is for another country than the page's, and nothing on the
 * v1 routes, where the whole metadata holds the variables.
 */
function useV2VariablesInBackground(): void {
  const dispatch = useDispatch<AppDispatch>();
  const target = useV2VariablesTarget();
  const queryClient = useQueryClient();
  const { countryId, policyengineVersion, loadId, inStore, enabled } = target;
  useEffect(() => {
    if (!enabled) {
      return;
    }
    queryClient.removeQueries({
      queryKey: [V2_CATALOG_VARIABLES],
      predicate: (cached) => cached.queryKey[3] !== loadId,
    });
    // A failure stays in the query, where views waiting for the variables report it.
    queryClient
      .fetchQuery(
        catalogVariablesQuery(dispatch, {
          countryId,
          policyengineVersion,
          loadId,
          inStore,
          enabled,
        })
      )
      .catch(() => undefined);
  }, [countryId, policyengineVersion, loadId, inStore, enabled, queryClient, dispatch]);
}

function noBackgroundLoad(): void {}

export const useV3VariablesInBackground: () => void =
  V3_API_ROUTES === 'v2' ? useV2VariablesInBackground : noBackgroundLoad;

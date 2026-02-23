import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useModelVersion } from '@/hooks/useModelVersion';
import { useEntities } from '@/hooks/useStaticMetadata';
import { getCachedVariables } from '@/libs/metadataCache';
import {
  fetchMetadataThunk,
  fetchVariablesThunk,
  hydrateVariables,
} from '@/reducers/metadataReducer';
import { AppDispatch, RootState } from '@/store';
import { HouseholdMetadataContext } from '@/utils/householdValues';

/**
 * Selects metadata loading state from Redux.
 */
export function selectMetadataState(state: RootState) {
  return {
    loading: state.metadata.loading,
    loaded: state.metadata.loaded,
    error: state.metadata.error,
    currentCountry: state.metadata.currentCountry,
  };
}

/**
 * Hook that fetches metadata (datasets, version) for a country and loads
 * variables via a cache-first background strategy.
 *
 * Loading flow:
 * 1. Hydrate variables from localStorage cache (instant — consumers have data immediately)
 * 2. Fetch datasets + version (fast — sets loaded: true so MetadataGuard passes)
 * 3. Fetch variables from API in background (updates Redux + localStorage when done)
 *
 * Also checks the model version for localStorage cache invalidation.
 *
 * @param countryId - Country to fetch metadata for (e.g., 'us', 'uk')
 */
export function useFetchMetadata(countryId: string): void {
  const dispatch = useDispatch<AppDispatch>();
  const { loading, loaded, currentCountry } = useSelector(selectMetadataState);

  // Check model version and invalidate localStorage cache if it changed.
  // This runs alongside the Redux metadata fetch so parameter tree hooks
  // that read from localStorage will have stale data cleared promptly.
  useModelVersion(countryId);

  useEffect(() => {
    // Fetch if:
    // - Not currently loading
    // - Not already loaded for this country
    const needsFetch = !loading && (!loaded || countryId !== currentCountry);

    if (needsFetch && countryId) {
      // 1. Hydrate variables from localStorage cache immediately
      const cached = getCachedVariables(countryId);
      if (cached) {
        dispatch(hydrateVariables({ variables: cached, countryId }));
      }

      // 2. Fetch datasets + version (fast, sets loaded: true)
      dispatch(fetchMetadataThunk(countryId));

      // 3. Fetch variables from API in background (updates Redux + cache)
      dispatch(fetchVariablesThunk(countryId));
    }
  }, [countryId, loading, loaded, currentCountry, dispatch]);
}

/**
 * Hook that builds a HouseholdMetadataContext by combining Redux variables with static entities.
 * Use this to get the metadata context needed for household value extraction utilities.
 *
 * @returns HouseholdMetadataContext with variables and entities
 */
export function useHouseholdMetadataContext(): HouseholdMetadataContext {
  const countryId = useCurrentCountry();
  const reduxMetadata = useSelector((state: RootState) => state.metadata);
  const entities = useEntities(countryId);

  return useMemo(
    () => ({ variables: reduxMetadata.variables, entities }),
    [reduxMetadata.variables, entities]
  );
}

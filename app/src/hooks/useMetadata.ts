import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useEntities } from '@/hooks/useStaticMetadata';
import { fetchMetadataThunk } from '@/reducers/metadataReducer';
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
 * Hook that fetches all metadata (variables, datasets, parameters) for a country.
 *
 * This is the V2 unified loading approach - loads all metadata in a single fetch.
 *
 * @param countryId - Country to fetch metadata for (e.g., 'us', 'uk')
 */
export function useFetchMetadata(countryId: string): void {
  const dispatch = useDispatch<AppDispatch>();
  const { loading, loaded, currentCountry } = useSelector(selectMetadataState);

  useEffect(() => {
    // Fetch if:
    // - Not currently loading
    // - Not already loaded for this country
    const needsFetch = !loading && (!loaded || countryId !== currentCountry);

    if (needsFetch && countryId) {
      dispatch(fetchMetadataThunk(countryId));
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

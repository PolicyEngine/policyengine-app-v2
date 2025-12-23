import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCoreMetadataThunk } from '@/reducers/metadataReducer';
import { AppDispatch, RootState } from '@/store';

/**
 * Selects core metadata loading state from Redux.
 */
export function selectCoreMetadataState(state: RootState) {
  return {
    loading: state.metadata.loading,
    loaded: state.metadata.loaded,
    error: state.metadata.error,
    currentCountry: state.metadata.currentCountry,
  };
}

/**
 * Hook that fetches all metadata (variables, datasets, parameters, parameterValues) for a country.
 *
 * This is the V2 unified loading approach - loads all metadata in a single fetch.
 *
 * @param countryId - Country to fetch metadata for (e.g., 'us', 'uk')
 */
export function useFetchCoreMetadata(countryId: string): void {
  const dispatch = useDispatch<AppDispatch>();
  const { loading, loaded, currentCountry } = useSelector(selectCoreMetadataState);

  useEffect(() => {
    // Fetch if:
    // - Not currently loading
    // - Not already loaded for this country
    const needsFetch = !loading && (!loaded || countryId !== currentCountry);

    if (needsFetch && countryId) {
      dispatch(fetchCoreMetadataThunk(countryId));
    }
  }, [countryId, loading, loaded, currentCountry, dispatch]);
}

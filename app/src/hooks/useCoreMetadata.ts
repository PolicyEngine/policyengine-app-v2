import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCoreMetadataThunk } from '@/reducers/metadataReducer';
import { AppDispatch, RootState } from '@/store';

/**
 * Selects core metadata loading state from Redux.
 */
export function selectCoreMetadataState(state: RootState) {
  return {
    coreLoading: state.metadata.coreLoading,
    coreLoaded: state.metadata.coreLoaded,
    coreError: state.metadata.coreError,
    currentCountry: state.metadata.currentCountry,
  };
}

/**
 * Hook that fetches core metadata (variables + datasets) for a country.
 *
 * This is the V2 tiered loading approach - only loads what's needed immediately.
 * Parameters are loaded separately via useFetchParameters when needed.
 *
 * @param countryId - Country to fetch metadata for (e.g., 'us', 'uk')
 */
export function useFetchCoreMetadata(countryId: string): void {
  const dispatch = useDispatch<AppDispatch>();
  const { coreLoading, coreLoaded, currentCountry } = useSelector(selectCoreMetadataState);

  useEffect(() => {
    // Fetch if:
    // - Not currently loading
    // - Not already loaded for this country
    const needsFetch = !coreLoading && (!coreLoaded || countryId !== currentCountry);

    if (needsFetch && countryId) {
      dispatch(fetchCoreMetadataThunk(countryId));
    }
  }, [countryId, coreLoading, coreLoaded, currentCountry, dispatch]);
}

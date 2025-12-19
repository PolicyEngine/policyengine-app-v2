import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchParametersThunk } from '@/reducers/metadataReducer';
import { AppDispatch, RootState } from '@/store';

/**
 * Selects parameters loading state from Redux.
 */
export function selectParametersState(state: RootState) {
  return {
    coreLoaded: state.metadata.coreLoaded,
    parametersLoading: state.metadata.parametersLoading,
    parametersLoaded: state.metadata.parametersLoaded,
    parametersError: state.metadata.parametersError,
    currentCountry: state.metadata.currentCountry,
  };
}

/**
 * Hook that fetches parameters for a country.
 *
 * This is Tier 2 of the V2 tiered loading approach - only loads parameters
 * when needed (e.g., on policy editing pages).
 *
 * Prerequisites:
 * - Core metadata must be loaded first (coreLoaded === true)
 *
 * @param countryId - Country to fetch parameters for (e.g., 'us', 'uk')
 */
export function useFetchParameters(countryId: string): void {
  const dispatch = useDispatch<AppDispatch>();
  const { coreLoaded, parametersLoading, parametersLoaded, currentCountry } =
    useSelector(selectParametersState);

  useEffect(() => {
    // Only fetch if:
    // - Core metadata is loaded (prerequisite)
    // - Not currently loading parameters
    // - Parameters not already loaded for this country
    const needsFetch =
      coreLoaded &&
      !parametersLoading &&
      (!parametersLoaded || countryId !== currentCountry);

    if (needsFetch && countryId) {
      dispatch(fetchParametersThunk(countryId));
    }
  }, [countryId, coreLoaded, parametersLoading, parametersLoaded, currentCountry, dispatch]);
}

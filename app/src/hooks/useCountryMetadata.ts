import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMetadataThunk } from '@/reducers/metadataReducer';
import { AppDispatch, RootState } from '@/store';
import { useCurrentCountry } from './useCurrentCountry';

// TODO: This hook has been added with intention to replace the useFetchMetadata hook for
// better sync between metadata and country Id retrieved from URL path param.
// To be revisited in separate issue.
/**
 * Hook that provides both current country and its metadata with proper synchronization.
 *
 * This hook ensures metadata is fetched for the current country and provides loading states
 * to prevent components from using stale metadata when country changes.
 *
 * @example
 * ```tsx
 * function TaxCalculator() {
 *   const { country, metadata, isLoading } = useCountryMetadata();
 *
 *   if (isLoading) {
 *     return <Spinner />;
 *   }
 *
 *   // Safe to use metadata - guaranteed to match current country
 *   const taxRates = metadata.parameters.tax_rates;
 *   // ...
 * }
 * ```
 *
 * @returns {Object} Object containing:
 * - country: Current country ID from URL
 * - metadata: Metadata for current country (null if loading or mismatched)
 * - isLoading: Whether metadata is being fetched
 * - error: Any error that occurred during fetch
 */
export function useCountryMetadata() {
  const dispatch = useDispatch<AppDispatch>();
  const country = useCurrentCountry();
  const metadataState = useSelector((state: RootState) => state.metadata);

  // Trigger fetch when country changes
  useEffect(() => {
    // Only fetch if we don't already have metadata for this country
    if (!metadataState.version || country !== metadataState.currentCountry) {
      dispatch(fetchMetadataThunk(country));
    }
  }, [country, metadataState.currentCountry, metadataState.version, dispatch]);

  // Determine if metadata is ready for the current country
  const isReady =
    !metadataState.loading &&
    metadataState.currentCountry === country &&
    metadataState.version !== null;

  return {
    country,
    metadata: isReady ? metadataState : null,
    isLoading: metadataState.loading || !isReady,
    error: metadataState.error,
  };
}

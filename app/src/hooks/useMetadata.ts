import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMetadataThunk } from '@/reducers/metadataReducer';
import { AppDispatch, RootState } from '@/store';

/**
 * Hook that ensures metadata is fetched for the specified country.
 *
 * This hook triggers a metadata fetch when:
 * - Component mounts and no metadata exists
 * - countryId parameter changes (e.g., when URL route changes)
 * - Current country in state differs from requested country
 *
 * Components should use useSelector to read metadata from Redux state
 *
 * @param countryId - Country code to fetch metadata for (e.g., 'us', 'uk', 'ca')
 */
export function useFetchMetadata(countryId?: string): void {
  const dispatch = useDispatch<AppDispatch>();
  const metadata = useSelector((state: RootState) => state.metadata);

  useEffect(() => {
    const country = countryId || metadata.currentCountry || 'us';

    // Only fetch if we don't already have metadata for this country
    if (!metadata.version || country !== metadata.currentCountry) {
      dispatch(fetchMetadataThunk(country));
    }
  }, [countryId, metadata.currentCountry, metadata.version, dispatch]);
}

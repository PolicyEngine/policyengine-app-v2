import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMetadataThunk } from '@/reducers/metadataReducer';
import { AppDispatch, RootState } from '@/store';

/**
 * Hook that ensures metadata is fetched for the current country.
 *
 * This hook triggers a metadata fetch when:
 * - Component mounts and no metadata exists
 * - countryId parameter changes (e.g., when URL route changes)
 * - Current country in state differs from requested country
 *
 * Components should use useSelector to read metadata from Redux state
 */
export function useFetchMetadata(countryId: string): void {
  const dispatch = useDispatch<AppDispatch>();
  const metadata = useSelector((state: RootState) => state.metadata);

  useEffect(() => {
    // Only fetch if we don't already have metadata for this country
    if (!metadata.version || countryId !== metadata.currentCountry) {
      dispatch(fetchMetadataThunk(countryId));
    }
  }, [countryId, metadata.currentCountry, metadata.version, dispatch]);
}

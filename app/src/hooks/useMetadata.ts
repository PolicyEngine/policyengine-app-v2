import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMetadataThunk, metadataRequest } from '@/reducers/metadataReducer';
import { AppDispatch, RootState } from '@/store';
import type { MetadataRoutes } from '@/types/metadata';

/**
 * Hook that ensures metadata is fetched for the current country.
 *
 * This hook triggers a metadata fetch when:
 * - Component mounts and no metadata exists
 * - countryId parameter changes (e.g., when URL route changes)
 * - Current country in state differs from requested country
 * - The metadata in state came from other routes than `routes` (v1's
 *   whole-model route, or v2's small model catalog; see v3ApiRoutes)
 *
 * Components should use useSelector to read metadata from Redux state
 */
export function useFetchMetadata(countryId: string, routes: MetadataRoutes = 'v1'): void {
  const dispatch = useDispatch<AppDispatch>();
  const metadata = useSelector((state: RootState) => state.metadata);
  const loadedRoutes = metadata.routes ?? 'v1';

  useEffect(() => {
    // Only fetch if we don't already have metadata for this country from these routes
    if (!metadata.version || countryId !== metadata.currentCountry || loadedRoutes !== routes) {
      dispatch(fetchMetadataThunk(metadataRequest(countryId, routes)));
    }
  }, [countryId, routes, loadedRoutes, metadata.currentCountry, metadata.version, dispatch]);
}

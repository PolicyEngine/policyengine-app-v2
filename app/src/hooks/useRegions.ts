import { REGION_SURFACE_SOURCE } from '@/config/regionSource';
import type { CountryId } from '@/libs/countries';
import { useMetadataRegions } from './useMetadataRegions';

export function useRegions(countryId: CountryId, options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;

  const metadataRegions = useMetadataRegions(countryId, { enabled });

  return {
    ...metadataRegions,
    data: metadataRegions.data,
    surfaceSource: REGION_SURFACE_SOURCE,
    metadataData: metadataRegions.data,
    apiData: undefined,
  };
}

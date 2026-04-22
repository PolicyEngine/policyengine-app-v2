import { LOAD_API_REGION_SHADOW, REGION_SURFACE_SOURCE } from '@/config/regionSource';
import type { CountryId } from '@/libs/countries';
import { useApiRegions } from './useApiRegions';
import { useMetadataRegions } from './useMetadataRegions';

export function useRegions(countryId: CountryId, options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;

  const metadataRegions = useMetadataRegions(countryId, { enabled });
  const apiRegions = useApiRegions(countryId, {
    enabled: enabled && (REGION_SURFACE_SOURCE === 'api' || LOAD_API_REGION_SHADOW),
  });

  const surfacedRegions = REGION_SURFACE_SOURCE === 'api' ? apiRegions : metadataRegions;

  return {
    ...surfacedRegions,
    data: surfacedRegions.data,
    surfaceSource: REGION_SURFACE_SOURCE,
    metadataData: metadataRegions.data,
    apiData: apiRegions.data,
  };
}

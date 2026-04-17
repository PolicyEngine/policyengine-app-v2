import { useQuery } from '@tanstack/react-query';
import { fetchRegions } from '@/api/v2/regions';
import type { CountryId } from '@/libs/countries';
import { queryConfig } from '@/libs/queryConfig';
import { regionKeys } from '@/libs/queryKeys';
import { toRegionRecord } from '@/models/region';

export function useRegions(countryId: CountryId, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: regionKeys.byCountry(countryId),
    queryFn: async () => {
      const regions = await fetchRegions(countryId);
      return regions.map((region) => toRegionRecord(countryId, region));
    },
    enabled: options?.enabled ?? true,
    ...queryConfig.api,
  });
}

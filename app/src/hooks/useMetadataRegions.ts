import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { CountryId } from '@/libs/countries';
import { fromMetadataRegionEntry, type RegionRecord } from '@/models/region';
import type { RootState } from '@/store';

interface UseMetadataRegionsResult {
  data: RegionRecord[] | undefined;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  error: Error | null;
}

export function useMetadataRegions(
  countryId: CountryId,
  options?: { enabled?: boolean }
): UseMetadataRegionsResult {
  const enabled = options?.enabled ?? true;
  const currentCountry = useSelector((state: RootState) => state.metadata.currentCountry);
  const loading = useSelector((state: RootState) => state.metadata.loading);
  const errorMessage = useSelector((state: RootState) => state.metadata.error);
  const metadataRegions = useSelector((state: RootState) => state.metadata.economyOptions.region);

  const data = useMemo(() => {
    if (!enabled) {
      return undefined;
    }

    if (currentCountry !== null && currentCountry !== countryId) {
      return [];
    }

    return (metadataRegions ?? []).map((region) => fromMetadataRegionEntry(countryId, region));
  }, [countryId, currentCountry, enabled, metadataRegions]);

  const error = enabled && errorMessage ? new Error(errorMessage) : null;
  const isLoading = enabled && loading;
  const isError = enabled && !!error;
  const isSuccess = enabled && !isLoading && !isError;

  return {
    data,
    isLoading,
    isError,
    isSuccess,
    error,
  };
}

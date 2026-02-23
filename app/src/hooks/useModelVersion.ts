/**
 * Hook that fetches the model version for a country and manages
 * localStorage cache invalidation.
 *
 * On mount, fetches the model + latest version via the by-country endpoint.
 * Compares against the locally cached version. If the version changed,
 * clears the metadata cache and invalidates all parameter tree queries
 * so they refetch with fresh data.
 */

import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchModelByCountry } from '@/api/v2';
import {
  clearMetadataCache,
  getCachedModelVersion,
  setCachedModelVersion,
} from '@/libs/metadataCache';
import { parameterTreeKeys } from '@/libs/queryKeys';

export function useModelVersion(countryId: string) {
  const queryClient = useQueryClient();
  const hasCheckedVersion = useRef(false);

  const query = useQuery({
    queryKey: ['model-version', countryId],
    queryFn: () => fetchModelByCountry(countryId),
    enabled: !!countryId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  useEffect(() => {
    if (!query.data || hasCheckedVersion.current) return;
    hasCheckedVersion.current = true;

    const { latest_version } = query.data;
    const cached = getCachedModelVersion(countryId);

    if (cached && cached.versionId !== latest_version.id) {
      // Version changed — clear stale metadata cache and refetch
      clearMetadataCache(countryId);
      queryClient.invalidateQueries({ queryKey: parameterTreeKeys.all });
    }

    // Always write the current version to cache
    setCachedModelVersion(countryId, latest_version.id, latest_version.version);
  }, [query.data, countryId, queryClient]);

  return {
    model: query.data?.model ?? null,
    latestVersion: query.data?.latest_version ?? null,
    isLoading: query.isLoading,
    error: query.error,
  };
}

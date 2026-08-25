import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchTrackerBills, TrackedBill } from '@/api/billFeed';
import { CountryId } from '@/libs/countries';
import { registerUsagePaths, resetUsagePaths } from '@/libs/searchPriors';

/**
 * Bills for the Reforms surface, live from the tracker feed.
 *
 * There is no stand-in data: a deployment without tracker credentials
 * reports `isConfigured: false` and the surface says so, rather than
 * showing invented bills that read as real analyses.
 */
export function useTrackedBills(countryId: CountryId): {
  bills: TrackedBill[];
  /** False when this deployment has no tracker credentials configured. */
  isConfigured: boolean;
  isLoading: boolean;
  isError: boolean;
} {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['tracker-bills'],
    queryFn: fetchTrackerBills,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  // Parameters used in real analyses feed the search ranking prior.
  // Reset-then-register keeps this idempotent across mounts.
  useEffect(() => {
    if (data && data.length > 0) {
      resetUsagePaths();
      registerUsagePaths(data.flatMap((bill) => bill.provisions.map((p) => p.path)));
    }
  }, [data]);

  return {
    bills: (data ?? []).filter((bill) => bill.countryId === countryId),
    // fetchTrackerBills resolves to null — not an error — when the feed
    // has no credentials; undefined just means the query is still in flight.
    isConfigured: data !== null,
    isLoading,
    isError,
  };
}

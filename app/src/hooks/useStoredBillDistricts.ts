import { useQuery } from '@tanstack/react-query';
import { fetchTrackerBillDistricts } from '@/api/billFeed';

/**
 * A tracked bill's stored congressional-district results, for its
 * Districts tab while the full results are not loaded. Null when the
 * tracker has none for the bill.
 */
export function useStoredBillDistricts(billId: string | undefined) {
  return useQuery({
    queryKey: ['tracker-bill-districts', billId],
    queryFn: () => fetchTrackerBillDistricts(billId!),
    enabled: !!billId,
    staleTime: Infinity,
  });
}

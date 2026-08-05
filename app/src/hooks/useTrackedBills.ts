import { useQuery } from '@tanstack/react-query';
import { fetchTrackerBills, TrackedBill } from '@/api/billFeed';
import { SAMPLE_BILLS } from '@/data/flagship/sampleBills';
import { CountryId } from '@/libs/countries';

function sampleBills(countryId: CountryId): TrackedBill[] {
  return SAMPLE_BILLS.filter((bill) => bill.countryId === countryId).map((bill) => ({
    id: bill.id,
    countryId: bill.countryId,
    jurisdiction: bill.jurisdiction,
    title: bill.title,
    status: bill.status,
    summary: bill.summary,
    provisions: bill.provisions.map((provision) => ({
      path: provision.path,
      value: provision.proposedValue,
      fallbackBreadcrumb: provision.fallbackBreadcrumb,
    })),
  }));
}

/**
 * Bills for the Reforms surface: the tracker's live Supabase feed when
 * configured, the in-repo samples otherwise. `isLive` drives the
 * sample-data footnote.
 */
export function useTrackedBills(countryId: CountryId): {
  bills: TrackedBill[];
  isLive: boolean;
  isLoading: boolean;
} {
  const { data, isLoading } = useQuery({
    queryKey: ['tracker-bills'],
    queryFn: fetchTrackerBills,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const live = (data ?? []).filter((bill) => bill.countryId === countryId);
  const isLive = Boolean(data && data.length > 0);
  return {
    bills: isLive ? live : sampleBills(countryId),
    isLive,
    isLoading,
  };
}

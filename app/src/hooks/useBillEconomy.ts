import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import type { TrackedBill } from '@/api/billFeed';
import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import { CURRENT_YEAR } from '@/constants';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { SocietyWideCalcStrategy } from '@/libs/calculations/economy/SocietyWideCalcStrategy';
import { createReformPolicy } from '@/libs/flagship/runReport';
import type { RootState } from '@/store';
import type { CalcStatus } from '@/types/calculation';

const strategy = new SocietyWideCalcStrategy();

export interface BillEconomy {
  output: SocietyWideReportOutput | null;
  status: 'pending' | 'complete' | 'error';
  message?: string;
  queuePosition?: number;
  reformPolicyId?: string;
  baselinePolicyId?: string;
  year: string;
  region: string;
  retry: () => void;
}

/** The API's own message from a failed request, without the status and JSON wrapper. */
function readableError(message: string): string {
  const body = message.match(/\{[\s\S]*\}\s*$/)?.[0];
  try {
    return body ? (JSON.parse(body).message ?? message) : message;
  } catch {
    return message;
  }
}

/** A state bill is scored on its state's data; a federal bill nationwide. */
export function billRegion(bill: Pick<TrackedBill, 'state'>, countryId: string): string {
  return bill.state ? `state/${bill.state.toLowerCase()}` : countryId;
}

/**
 * The full society-wide results for a tracked bill, computed without a
 * saved report: the reform policy (deduped by the API) is scored against
 * current law through the economy endpoint, whose results the server
 * caches, so a bill computed once opens quickly for everyone after.
 */
export function useBillEconomy(
  bill: Pick<TrackedBill, 'id' | 'title' | 'state' | 'provisions'> | undefined,
  { enabled = true }: { enabled?: boolean } = {}
): BillEconomy {
  const countryId = useCurrentCountry();
  const currentLawId = useSelector((state: RootState) => state.metadata.currentLawId);
  const region = bill ? billRegion(bill, countryId) : countryId;
  const provisions = bill?.provisions ?? [];

  const policy = useQuery({
    queryKey: ['flagship-bill-policy', countryId, bill?.id, provisions],
    queryFn: () => createReformPolicy(countryId, bill!.title, provisions),
    enabled: enabled && !!bill && provisions.length > 0,
    staleTime: Infinity,
  });

  const reformPolicyId = policy.data === undefined ? undefined : String(policy.data);
  const baselinePolicyId = currentLawId ? String(currentLawId) : undefined;
  // Progress is measured from when this page began waiting on the run.
  const metadata = useMemo(
    () => ({
      calcId: `bill-${bill?.id}`,
      calcType: 'societyWide' as const,
      targetType: 'report' as const,
      startedAt: Date.now(),
    }),
    [bill?.id, reformPolicyId]
  );

  const economy = useQuery({
    queryKey: ['flagship-bill-economy', countryId, reformPolicyId, baselinePolicyId, region],
    queryFn: () =>
      strategy.execute(
        {
          countryId,
          calcType: 'societyWide',
          policyIds: { baseline: baselinePolicyId!, reform: reformPolicyId },
          populationId: region,
          region,
          year: CURRENT_YEAR,
          calcId: metadata.calcId,
        },
        metadata
      ),
    enabled: enabled && !!reformPolicyId && !!baselinePolicyId,
    refetchInterval: (query) =>
      (query.state.data as CalcStatus | undefined)?.status === 'pending' ? 2000 : false,
    staleTime: Infinity,
  });

  const status: BillEconomy['status'] =
    policy.isError || economy.isError || economy.data?.status === 'error'
      ? 'error'
      : economy.data?.status === 'complete'
        ? 'complete'
        : 'pending';

  return {
    output:
      economy.data?.status === 'complete' ? (economy.data.result as SocietyWideReportOutput) : null,
    status,
    message:
      status === 'error'
        ? economy.data?.error?.message
          ? readableError(economy.data.error.message)
          : 'The calculation could not be started.'
        : economy.data?.message,
    queuePosition: economy.data?.queuePosition,
    reformPolicyId,
    baselinePolicyId,
    year: CURRENT_YEAR,
    region,
    retry: () => {
      if (policy.isError) {
        void policy.refetch();
      } else {
        void economy.refetch();
      }
    },
  };
}

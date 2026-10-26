import { useMemo } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import { SocietyWideCalcStrategy } from '@/libs/calculations/economy/SocietyWideCalcStrategy';
import type { CalcStatus, RunStage } from '@/types/calculation';

const strategy = new SocietyWideCalcStrategy();

export interface ReportYearEconomy {
  output: SocietyWideReportOutput | null;
  status: 'idle' | 'pending' | 'complete' | 'error';
  message?: string;
  progress?: number;
  runStage?: RunStage;
  queuePosition?: number;
  retry: () => void;
}

/**
 * A report's full results for another year of its budget window: the
 * same reform, comparison and population, scored in that year through
 * the economy endpoint. The server caches each year, so a year looked at
 * once opens at once after; nothing runs until a year is picked.
 */
export function useReportYearEconomy({
  countryId,
  reformPolicyId,
  baselinePolicyId,
  region,
  year,
  enabled,
}: {
  countryId: string;
  reformPolicyId?: string;
  baselinePolicyId?: string;
  region?: string;
  year: string;
  enabled: boolean;
}): ReportYearEconomy {
  const population = region || countryId;
  const metadata = useMemo(
    () => ({
      calcId: `report-year-${reformPolicyId}-${baselinePolicyId}-${population}-${year}`,
      calcType: 'societyWide' as const,
      targetType: 'report' as const,
      startedAt: Date.now(),
    }),
    [reformPolicyId, baselinePolicyId, population, year]
  );
  const ready = enabled && !!reformPolicyId && !!baselinePolicyId;
  const economy = useQuery({
    queryKey: [
      'flagship-report-year',
      countryId,
      reformPolicyId,
      baselinePolicyId,
      population,
      year,
    ],
    queryFn: () =>
      strategy.execute(
        {
          countryId: countryId as 'us',
          calcType: 'societyWide',
          policyIds: { baseline: baselinePolicyId!, reform: reformPolicyId },
          populationId: population,
          region: population,
          year,
          calcId: metadata.calcId,
          estimateByRegion: true,
        },
        metadata
      ),
    enabled: ready,
    refetchInterval: (query) =>
      (query.state.data as CalcStatus | undefined)?.status === 'pending' ? 2000 : false,
    staleTime: Infinity,
  });

  const status: ReportYearEconomy['status'] = !ready
    ? 'idle'
    : economy.isError || economy.data?.status === 'error'
      ? 'error'
      : economy.data?.status === 'complete'
        ? 'complete'
        : 'pending';
  return {
    output:
      economy.data?.status === 'complete' ? (economy.data.result as SocietyWideReportOutput) : null,
    status,
    message: status === 'error' ? economy.data?.error?.message : economy.data?.message,
    progress: economy.data?.progress,
    runStage: economy.data?.runStage,
    queuePosition: economy.data?.queuePosition,
    retry: () => void economy.refetch(),
  };
}

/**
 * Every requested year of a budget window, each scored as
 * `useReportYearEconomy` scores one. Years not requested do not run.
 */
export function useReportYearEconomies({
  countryId,
  reformPolicyId,
  baselinePolicyId,
  region,
  years,
}: {
  countryId: string;
  reformPolicyId?: string;
  baselinePolicyId?: string;
  region?: string;
  /** The years to score. */
  years: string[];
}): Record<string, ReportYearEconomy> {
  const population = region || countryId;
  const ready = !!reformPolicyId && !!baselinePolicyId;
  const results = useQueries({
    queries: years.map((year) => ({
      queryKey: [
        'flagship-report-year',
        countryId,
        reformPolicyId,
        baselinePolicyId,
        population,
        year,
      ],
      queryFn: () =>
        strategy.execute(
          {
            countryId: countryId as 'us',
            calcType: 'societyWide' as const,
            policyIds: { baseline: baselinePolicyId!, reform: reformPolicyId },
            populationId: population,
            region: population,
            year,
            calcId: `report-year-${reformPolicyId}-${baselinePolicyId}-${population}-${year}`,
            estimateByRegion: true,
          },
          {
            calcId: `report-year-${reformPolicyId}-${baselinePolicyId}-${population}-${year}`,
            calcType: 'societyWide' as const,
            targetType: 'report' as const,
            startedAt: Date.now(),
          }
        ),
      enabled: ready,
      refetchInterval: (query: { state: { data?: CalcStatus } }) =>
        query.state.data?.status === 'pending' ? 2000 : false,
      staleTime: Infinity,
    })),
  });
  return Object.fromEntries(
    years.map((year, index) => {
      const economy = results[index];
      const status: ReportYearEconomy['status'] = !ready
        ? 'idle'
        : economy.isError || economy.data?.status === 'error'
          ? 'error'
          : economy.data?.status === 'complete'
            ? 'complete'
            : 'pending';
      return [
        year,
        {
          output:
            economy.data?.status === 'complete'
              ? (economy.data.result as SocietyWideReportOutput)
              : null,
          status,
          message: status === 'error' ? economy.data?.error?.message : economy.data?.message,
          progress: economy.data?.progress,
          runStage: economy.data?.runStage,
          queuePosition: economy.data?.queuePosition,
          retry: () => void economy.refetch(),
        },
      ];
    })
  );
}

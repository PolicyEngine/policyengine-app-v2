import { useQueries, useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import { economyRunStartedAt, runProgressStateOf } from '@/libs/calculations/runProgress';
import { calculationQueries } from '@/libs/queries/calculationQueries';
import type { CalcStatus, RunStage } from '@/types/calculation';

/** How often a year still computing is checked on. */
const POLL_MS = 2000;

export interface ReportYearEconomy {
  output: SocietyWideReportOutput | null;
  status: 'idle' | 'pending' | 'complete' | 'error';
  message?: string;
  /** 0–100 while pending: the highest value the year's bar reached at a poll. */
  progress?: number;
  runStage?: RunStage;
  queuePosition?: number;
  /** When the year's run was first requested (epoch ms), while it computes. */
  startedAt?: number;
  retry: () => void;
}

interface ReportYearRun {
  countryId: string;
  reformPolicyId?: string;
  baselinePolicyId?: string;
  /** The region as sent to the API, or the country for a nationwide report. */
  population: string;
  year: string;
}

/** The query options of one year's economy run. */
function reportYearQuery({
  countryId,
  reformPolicyId,
  baselinePolicyId,
  population,
  year,
}: ReportYearRun) {
  const calcId = `report-year-${reformPolicyId}-${baselinePolicyId}-${population}-${year}`;
  return calculationQueries.forEconomyRun({
    queryKey: [
      'flagship-report-year',
      countryId,
      reformPolicyId,
      baselinePolicyId,
      population,
      year,
    ],
    params: {
      countryId: countryId as 'us',
      calcType: 'societyWide' as const,
      policyIds: { baseline: baselinePolicyId!, reform: reformPolicyId },
      populationId: population,
      region: population,
      year,
      calcId,
      estimateByRegion: true,
    },
    // Built when each request is sent, from the year's cached status: a year
    // still computing keeps its first request's start time, which its bar
    // measures from; a new run, or one tried again after it failed, starts now.
    metadata: (cached: CalcStatus | undefined) => ({
      calcId,
      calcType: 'societyWide' as const,
      targetType: 'report' as const,
      startedAt: economyRunStartedAt(cached),
    }),
    pollIntervalMs: POLL_MS,
  });
}

/** One year's run, as the page reads it. */
function reportYearEconomyOf(
  economy: UseQueryResult<CalcStatus>,
  ready: boolean
): ReportYearEconomy {
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
    startedAt: runProgressStateOf(economy.data)?.startedAt,
    retry: () => void economy.refetch(),
  };
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
  const ready = enabled && !!reformPolicyId && !!baselinePolicyId;
  const economy = useQuery({
    ...reportYearQuery({
      countryId,
      reformPolicyId,
      baselinePolicyId,
      population: region || countryId,
      year,
    }),
    enabled: ready,
  });
  return reportYearEconomyOf(economy, ready);
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
      ...reportYearQuery({ countryId, reformPolicyId, baselinePolicyId, population, year }),
      enabled: ready,
    })),
  });
  return Object.fromEntries(
    years.map((year, index) => [year, reportYearEconomyOf(results[index], ready)])
  );
}

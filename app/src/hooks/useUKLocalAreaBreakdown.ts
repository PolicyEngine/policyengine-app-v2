import { useState } from 'react';
import { hashKey, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchLocalAreaBreakdown,
  isLocalAreaBreakdown,
  type LocalAreaBreakdownResponse,
} from '@/api/societyWideCalculation';
import { clockProgress, runProgressValue } from '@/components/flagship/report/RunProgress';
import { UK_LOCAL_AREA_BREAKDOWN_DURATION_MS } from '@/constants/calculationDurations';
import type { RunStage } from '@/types/calculation';
import type { LocalAreaBreakdown } from '@/types/metadata/LocalAreaBreakdown';

/** How often a run that is still computing is polled. */
const POLL_INTERVAL_MS = 2000;

const NOT_A_BREAKDOWN_MESSAGE =
  'The API returned national results instead of a local-area breakdown. Its deployment may not support breakdown=local_areas yet.';

export interface UKLocalAreaBreakdownRequest {
  countryId: string;
  reformPolicyId?: string | null;
  baselinePolicyId?: string | null;
  /** The report's region: `uk` (or empty, for the UK) or `country/*`. */
  region?: string | null;
  year?: string | null;
}

export type UKLocalAreaBreakdownStatus = 'idle' | 'computing' | 'error' | 'complete';

export interface UKLocalAreaBreakdownState {
  status: UKLocalAreaBreakdownStatus;
  /** The constituency and local authority impacts, once the run is complete. */
  breakdown: LocalAreaBreakdown | null;
  /** 0–100 while computing: the time estimate, held inside the stage the API reports. */
  progress?: number;
  /** The run's stage from the API, e.g. `loading_data`, when it reports one. */
  stage?: string;
  queuePosition?: number;
  error?: string;
  /** False until the report's policies and year are known. */
  canStart: boolean;
  start: () => void;
  retry: () => void;
}

/** A run's state as the query cache holds it, shared by every view of the report. */
interface BreakdownRun {
  status: 'computing' | 'complete' | 'error';
  /** When this run was first sent (epoch ms), for the time estimate. */
  startedAt: number;
  breakdown: LocalAreaBreakdown | null;
  progress?: number;
  stage?: string;
  queuePosition?: number;
  error?: string;
}

/**
 * The breakdown's react-query key: one run per country, reform, baseline,
 * region and year, so every view of a report shares it. An empty region is
 * the country.
 */
export function ukLocalAreaBreakdownQueryKey({
  countryId,
  reformPolicyId,
  baselinePolicyId,
  region,
  year,
}: UKLocalAreaBreakdownRequest) {
  return [
    'uk-local-area-breakdown',
    countryId,
    reformPolicyId ?? null,
    baselinePolicyId ?? null,
    region || countryId,
    year ?? null,
  ] as const;
}

/** The API's stage fields as a RunStage, as SocietyWideCalcStrategy reads them. */
function runStageOf(response: LocalAreaBreakdownResponse): RunStage | undefined {
  if (typeof response.progress !== 'number' || typeof response.progress_max !== 'number') {
    return undefined;
  }
  return {
    floor: response.progress,
    max: Math.max(response.progress, response.progress_max),
  };
}

function toRun(
  response: LocalAreaBreakdownResponse,
  startedAt: number,
  previous: BreakdownRun | undefined
): BreakdownRun {
  if (response.status === 'computing') {
    const estimate = clockProgress(Date.now() - startedAt, UK_LOCAL_AREA_BREAKDOWN_DURATION_MS);
    const progress = runProgressValue(estimate, runStageOf(response));
    return {
      status: 'computing',
      startedAt,
      breakdown: null,
      // The bar never moves backwards between polls.
      progress:
        previous?.status === 'computing' ? Math.max(previous.progress ?? 0, progress) : progress,
      stage: typeof response.stage === 'string' ? response.stage : undefined,
      queuePosition: response.queue_position,
    };
  }
  if (response.status === 'ok' && response.result) {
    // A deployment that ignores breakdown=local_areas answers with national results.
    if (!isLocalAreaBreakdown(response.result)) {
      return { status: 'error', startedAt, breakdown: null, error: NOT_A_BREAKDOWN_MESSAGE };
    }
    return { status: 'complete', startedAt, breakdown: response.result };
  }
  return {
    status: 'error',
    startedAt,
    breakdown: null,
    error: response.error || 'The local-area breakdown failed',
  };
}

/**
 * A UK report's constituency and local authority impacts, calculated on
 * request by a separate run of the economy endpoint
 * (`breakdown=local_areas`) for the report's region and year. Nothing is sent
 * until `start()`. The run is polled every 2 s while it computes, and its
 * result is kept for the session.
 *
 * Every view of the same report shares one run through the query key: a view
 * opened while another view's run computes, or after it completes, follows
 * that run without sending its own. This does not go through
 * CalcOrchestrator, so the report's saved national output is left as it is.
 */
export function useUKLocalAreaBreakdown(
  request: UKLocalAreaBreakdownRequest
): UKLocalAreaBreakdownState {
  const { countryId, reformPolicyId, baselinePolicyId, region, year } = request;
  const queryClient = useQueryClient();
  const queryKey = ukLocalAreaBreakdownQueryKey(request);
  // Which run start() asked for. A view kept mounted while its report
  // changes year (a budget window) must not send the new year's request
  // until it is asked for too.
  const queryKeyHash = hashKey(queryKey);
  const [startedKeyHash, setStartedKeyHash] = useState<string | null>(null);
  const started = startedKeyHash === queryKeyHash;
  const canStart = !!reformPolicyId && !!baselinePolicyId && !!year;
  // A run another view started, or finished, is followed here too.
  const runExists = queryClient.getQueryData<BreakdownRun>(queryKey) !== undefined;

  const query = useQuery({
    queryKey,
    queryFn: async (): Promise<BreakdownRun> => {
      const previous = queryClient.getQueryData<BreakdownRun>(queryKey);
      const startedAt = previous?.status === 'computing' ? previous.startedAt : Date.now();
      try {
        const response = await fetchLocalAreaBreakdown(
          countryId,
          reformPolicyId!,
          baselinePolicyId!,
          { region: region || countryId, time_period: year! }
        );
        return toRun(response, startedAt, previous);
      } catch (error) {
        return {
          status: 'error',
          startedAt,
          breakdown: null,
          error: error instanceof Error ? error.message : 'The local-area breakdown failed',
        };
      }
    },
    enabled: canStart && (started || runExists),
    refetchInterval: (current) =>
      current.state.data?.status === 'computing' ? POLL_INTERVAL_MS : false,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const run = query.data;
  const status: UKLocalAreaBreakdownStatus =
    run?.status === 'complete'
      ? 'complete'
      : run?.status === 'computing' || (canStart && query.isFetching)
        ? 'computing'
        : run?.status === 'error'
          ? 'error'
          : 'idle';

  return {
    status,
    breakdown: run?.status === 'complete' ? run.breakdown : null,
    progress: run?.status === 'computing' ? run.progress : undefined,
    stage: run?.status === 'computing' ? run.stage : undefined,
    queuePosition: run?.status === 'computing' ? run.queuePosition : undefined,
    error: status === 'error' ? run?.error : undefined,
    canStart,
    start: () => {
      if (canStart) {
        setStartedKeyHash(queryKeyHash);
      }
    },
    retry: () => {
      if (canStart) {
        setStartedKeyHash(queryKeyHash);
        void query.refetch();
      }
    },
  };
}

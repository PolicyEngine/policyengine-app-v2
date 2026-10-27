import { useMemo, useRef } from 'react';
import { useQueries, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import {
  districtsOf,
  mergeStateDistricts,
} from '@/adapters/congressional-district/congressionalDistrictDataAdapter';
import { ReportAdapter } from '@/adapters/ReportAdapter';
import {
  fetchSocietyWideCalculation,
  type SocietyWideReportOutput,
} from '@/api/societyWideCalculation';
import {
  US_STATE_DISTRICT_RUN_TIME_LIMIT_MS,
  US_STATE_SOCIETY_WIDE_DURATION_MS,
} from '@/constants/calculationDurations';
import { useRegions } from '@/hooks/useRegions';
import { pollRun, type PolledRun, type PollRunOptions } from '@/libs/calculations/polledRun';
import { ResultPersister } from '@/libs/calculations/ResultPersister';
import { createReportRecords } from '@/libs/flagship/runReport';
import type { EconomyOutput, Report } from '@/types/ingredients/Report';
import type { USCongressionalDistrictBreakdownItem } from '@/types/metadata/ReportOutputSocietyWideByCongressionalDistrict';
import { createConcurrencyLimit, type ConcurrencyLimit } from '@/utils/concurrencyLimit';
import { getUSStates } from '@/utils/regionStrategies';

/**
 * Requests the state district runs keep in flight per browser tab, counting
 * record requests, run starts and polls. The Public API's production
 * service has about 12 warm request slots (2 instances of 6), and a new
 * instance takes about 6 minutes to start.
 */
export const STATE_DISTRICT_REQUEST_CONCURRENCY = 4;

/** How often a state that is still computing is polled: 51 states make about 10 requests a second. */
export const STATE_DISTRICT_POLL_INTERVAL_MS = 5000;

const TIME_LIMIT_MESSAGE =
  'This state is taking much longer than expected. It may still finish on the server: retry to check it again.';

const NO_DISTRICTS_MESSAGE = "This state's result has no congressional districts.";

type District = USCongressionalDistrictBreakdownItem;

export interface StateDistrictRunsRequest {
  reformPolicyId?: string;
  baselinePolicyId?: string;
  year?: string;
}

/** A state's records as the lookup finds them on the Public API. */
export interface StateDistrictRecords {
  /** The state's base report. */
  reportId: string;
  reportStatus: Report['status'];
  /** The base report's districts, only when it is complete and holds them. */
  districts: District[] | null;
}

/** A state's run as the query cache holds it: its districts once complete, or null. */
type StateRun = PolledRun<District[] | null>;

export type StateDistrictRunsStatus =
  | 'checking'
  | 'idle'
  | 'computing'
  | 'partial'
  | 'error'
  | 'complete';

export interface StateDistrictRuns {
  /**
   * `checking` while the states' records are looked up; `idle` until
   * Compute; `computing` while any state runs or waits; once every state
   * has settled, `complete` when all their districts are in, `partial`
   * when some are, and `error` when none are.
   */
  status: StateDistrictRunsStatus;
  /** Every state's districts that are in so far, with normalised IDs. */
  districts: District[];
  /** States (`state/ca`) whose districts are not in yet and have not failed. */
  pendingStates: string[];
  /** States whose districts could not be found or calculated. */
  failedStates: string[];
  /** The failed states' names, in the same order. */
  failedStateLabels: string[];
  /** Why the first failed state failed. */
  error?: string;
  /** States whose districts are in. */
  completedCount: number;
  /** States the report covers: the 50 states and DC. */
  totalStates: number;
  /**
   * 0–100: the average across the states, each counting 1 once settled,
   * its own clock progress while it runs, and 0 while it waits; at most
   * 99 until every state settles.
   */
  progress: number;
  /** False until the report's policies and year, and the states, are known. */
  canStart: boolean;
  /** Whether Retry would ask again for a failed state or failed records. */
  canRetry: boolean;
  /** Computes every state whose districts are not in, for every view of this year. */
  start: () => void;
  /** Asks again for each failed state and failed records; a result with no districts stays. */
  retry: () => void;
}

/** A state's records' react-query key: one per reform, baseline, year and state. */
export function stateDistrictRecordsQueryKey(
  { reformPolicyId, baselinePolicyId, year }: StateDistrictRunsRequest,
  region: string
) {
  return [
    'us-state-district-records',
    reformPolicyId ?? null,
    baselinePolicyId ?? null,
    year ?? null,
    region,
  ] as const;
}

/** A state's run's react-query key: one per reform, baseline, year and state. */
export function stateDistrictRunQueryKey(
  { reformPolicyId, baselinePolicyId, year }: StateDistrictRunsRequest,
  region: string
) {
  return [
    'us-state-district-run',
    reformPolicyId ?? null,
    baselinePolicyId ?? null,
    year ?? null,
    region,
  ] as const;
}

/**
 * Whether Compute was asked for this reform, baseline and year: a marker in
 * the query cache, so every view of the report follows one run.
 */
export function stateDistrictComputeQueryKey({
  reformPolicyId,
  baselinePolicyId,
  year,
}: StateDistrictRunsRequest) {
  return [
    'us-state-district-compute',
    reformPolicyId ?? null,
    baselinePolicyId ?? null,
    year ?? null,
  ] as const;
}

/** One limit per query client, so per browser tab, shared by every view. */
const requestLimits = new WeakMap<QueryClient, ConcurrencyLimit>();

function requestLimitFor(queryClient: QueryClient): ConcurrencyLimit {
  let limit = requestLimits.get(queryClient);
  if (!limit) {
    limit = createConcurrencyLimit(STATE_DISTRICT_REQUEST_CONCURRENCY);
    requestLimits.set(queryClient, limit);
  }
  return limit;
}

/**
 * Creates, or reuses, a state's two simulations and base report, through
 * the tab's request limit; a request still queued when the view closes is
 * dropped.
 *
 * These records are deliberately not associated with the user: no
 * `/v2/user-reports` record and no browser `pe-flagship-reports` record is
 * written for them. They exist so that each state's result is stored on its
 * base report, which prevents recalculation: the Public API reuses
 * simulations by population and policy, and base reports by both
 * simulations, year and cache version, so a later nationwide view, or
 * anyone's own report for that state with the same policies and year,
 * finds the result there.
 */
async function lookUpStateRecords(
  queryClient: QueryClient,
  { reformPolicyId, baselinePolicyId, year }: Required<StateDistrictRunsRequest>,
  region: string,
  signal: AbortSignal
): Promise<StateDistrictRecords> {
  const limit = requestLimitFor(queryClient);
  const metadata = await createReportRecords(
    'us',
    { region, baselinePolicyId, reformPolicyId, year },
    (request) => limit.run(request, signal)
  );
  const report = ReportAdapter.fromMetadata(metadata);
  return {
    reportId: String(report.id),
    reportStatus: report.status,
    districts:
      report.status === 'complete'
        ? districtsOf(report.output as EconomyOutput | null | undefined)
        : null,
  };
}

const STATE_RUN_POLL_OPTIONS: PollRunOptions<SocietyWideReportOutput, SocietyWideReportOutput> = {
  expectedMs: US_STATE_SOCIETY_WIDE_DURATION_MS,
  timeLimitMs: US_STATE_DISTRICT_RUN_TIME_LIMIT_MS,
  timeLimitMessage: TIME_LIMIT_MESSAGE,
  failureMessage: "The state's calculation failed",
  readResult: (result) => ({ result }),
};

/**
 * Writes a state's result, as received, to its base report, so that it is
 * not calculated again. Like the records, the write is deliberately not
 * associated with the user. A failed write is logged; the districts still
 * show. Errors are never written.
 */
async function saveStateResult(
  queryClient: QueryClient,
  reportId: string,
  run: PolledRun<SocietyWideReportOutput>,
  year: string
): Promise<void> {
  try {
    await new ResultPersister(queryClient).persist(
      {
        status: 'complete',
        result: run.result!,
        metadata: {
          calcId: reportId,
          calcType: 'societyWide',
          targetType: 'report',
          startedAt: run.startedAt,
        },
      },
      'us',
      year
    );
  } catch (error) {
    console.error('[useStateDistrictRuns] Failed to save a state result:', error);
  }
}

/**
 * Sends one poll of a state's run through the tab's request limit, and
 * writes its result to the state's base report when that report does not
 * hold one yet. A poll still queued when the view closes is dropped; one
 * already sent still writes its result.
 */
async function pollStateRun(
  queryClient: QueryClient,
  { reformPolicyId, baselinePolicyId, year }: Required<StateDistrictRunsRequest>,
  region: string,
  records: StateDistrictRecords,
  signal: AbortSignal
): Promise<StateRun> {
  const runKey = stateDistrictRunQueryKey({ reformPolicyId, baselinePolicyId, year }, region);
  const run = await requestLimitFor(queryClient).run(() => {
    // Read when the request is sent, so the clock starts then, not in the queue.
    const previous = queryClient.getQueryData<StateRun>(runKey);
    return pollRun(
      () =>
        // Only the region and year: the Public API picks the state's dataset.
        fetchSocietyWideCalculation('us', reformPolicyId, baselinePolicyId, {
          region,
          time_period: year,
        }),
      previous && { ...previous, result: null },
      STATE_RUN_POLL_OPTIONS
    );
  }, signal);
  if (run.status === 'complete' && records.reportStatus !== 'complete') {
    void saveStateResult(queryClient, records.reportId, run, year);
  }
  return { ...run, result: run.status === 'complete' ? districtsOf(run.result) : null };
}

/**
 * Each state's districts as one list, kept the same list until a state's
 * districts change, so the map is not drawn again on every poll.
 */
function useMergedDistricts(stateDistricts: Array<District[] | null>): District[] {
  const merged = useRef<{ inputs: Array<District[] | null>; districts: District[] } | null>(null);
  const previous = merged.current;
  if (
    !previous ||
    previous.inputs.length !== stateDistricts.length ||
    stateDistricts.some((districts, index) => districts !== previous.inputs[index])
  ) {
    merged.current = { inputs: stateDistricts, districts: mergeStateDistricts(stateDistricts) };
  }
  return merged.current!.districts;
}

/** Where one state stands. */
type StateStanding =
  | { kind: 'checking' }
  | { kind: 'records-failed'; error: string }
  | { kind: 'in'; districts: District[] }
  | { kind: 'no-districts' }
  | { kind: 'waiting' }
  | { kind: 'computing'; progress: number }
  | { kind: 'failed'; error: string };

/**
 * A nationwide US report's congressional districts, from each state's own
 * run on the state-level dataset rather than from the nationwide result.
 *
 * When the view opens, each of the 50 states and DC has its records
 * created or reused on the Public API, and a state whose base report
 * already holds its result shows its districts at once. Nothing is
 * computed until `start()` (Compute): then each remaining state's economy
 * run is requested with only its region and year, polled every 5 s, and
 * fills in its districts as it finishes, and its result is written to its
 * base report, deliberately with no user association, so that it is not
 * calculated again. A state computing for longer than
 * US_STATE_DISTRICT_RUN_TIME_LIMIT_MS fails, with Retry, which checks the
 * same run again.
 *
 * Every view of the same report and year shares the records, the runs and
 * Compute through their query keys, which are kept for the session; a year
 * computed is not computed again, and another year waits for its own
 * Compute. Closing the view stops polling and drops queued requests.
 */
export function useStateDistrictRuns(request: StateDistrictRunsRequest): StateDistrictRuns {
  const { reformPolicyId, baselinePolicyId, year } = request;
  const queryClient = useQueryClient();
  const { data: regions } = useRegions('us');
  const states = useMemo(() => getUSStates(regions ?? []), [regions]);
  const hasInputs = !!reformPolicyId && !!baselinePolicyId && !!year;
  const canStart = hasInputs && states.length > 0;
  const inputs = {
    reformPolicyId: reformPolicyId!,
    baselinePolicyId: baselinePolicyId!,
    year: year!,
  };

  const computeKey = stateDistrictComputeQueryKey(request);
  // Set by start() in the query cache, so every view of this year follows it.
  const { data: computeRequested = false } = useQuery({
    queryKey: computeKey,
    queryFn: () => false,
    enabled: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const lookups = useQueries({
    queries: states.map((state) => ({
      queryKey: stateDistrictRecordsQueryKey(request, state.value),
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        lookUpStateRecords(queryClient, inputs, state.value, signal),
      enabled: canStart,
      retry: false,
      staleTime: Infinity,
      gcTime: Infinity,
    })),
  });

  const runs = useQueries({
    queries: states.map((state, index) => {
      const records = lookups[index].data;
      const needsRun = !!records && !records.districts;
      return {
        queryKey: stateDistrictRunQueryKey(request, state.value),
        queryFn: ({ signal }: { signal: AbortSignal }) =>
          pollStateRun(queryClient, inputs, state.value, records!, signal),
        enabled: canStart && computeRequested && needsRun,
        retry: false,
        refetchInterval: (query: { state: { data?: StateRun } }) =>
          query.state.data?.status === 'computing' ? STATE_DISTRICT_POLL_INTERVAL_MS : false,
        staleTime: Infinity,
        gcTime: Infinity,
      };
    }),
  });

  const standings: StateStanding[] = states.map((_state, index): StateStanding => {
    const lookup = lookups[index];
    if (lookup.isError) {
      return {
        kind: 'records-failed',
        error: lookup.error instanceof Error ? lookup.error.message : 'The records failed',
      };
    }
    if (!lookup.data) {
      return { kind: 'checking' };
    }
    if (lookup.data.districts) {
      return { kind: 'in', districts: lookup.data.districts };
    }
    const run = runs[index];
    const data = run.data;
    if (data?.status === 'complete') {
      return data.result ? { kind: 'in', districts: data.result } : { kind: 'no-districts' };
    }
    if (data?.status === 'computing') {
      return { kind: 'computing', progress: data.progress ?? 0 };
    }
    // A failed state asked for again waits for its new answer.
    if (data?.status === 'error' && !run.isFetching) {
      return { kind: 'failed', error: data.error ?? STATE_RUN_POLL_OPTIONS.failureMessage };
    }
    return { kind: 'waiting' };
  });

  const pendingStates: string[] = [];
  const failedStates: string[] = [];
  const failedStateLabels: string[] = [];
  const retryableErrors: string[] = [];
  const stateDistricts: Array<District[] | null> = [];
  let settledShare = 0;
  let anyChecking = false;
  let anyUnsettled = false;

  standings.forEach((standing, index) => {
    const state = states[index];
    switch (standing.kind) {
      case 'in':
        stateDistricts.push(standing.districts);
        settledShare += 1;
        return;
      case 'records-failed':
      case 'failed':
        retryableErrors.push(standing.error);
        failedStates.push(state.value);
        failedStateLabels.push(state.label);
        settledShare += 1;
        return;
      case 'no-districts':
        failedStates.push(state.value);
        failedStateLabels.push(state.label);
        settledShare += 1;
        return;
      case 'computing':
        settledShare += standing.progress / 100;
        anyUnsettled = true;
        pendingStates.push(state.value);
        return;
      case 'checking':
        anyChecking = true;
        anyUnsettled = true;
        pendingStates.push(state.value);
        return;
      default:
        anyUnsettled = true;
        pendingStates.push(state.value);
    }
  });

  const completedCount = stateDistricts.length;
  const districts = useMergedDistricts(stateDistricts);
  const totalStates = states.length;
  const average = totalStates > 0 ? (settledShare / totalStates) * 100 : 0;
  const progress = anyUnsettled ? Math.min(average, 99) : 100;
  const hasNoDistrictsFailure = failedStates.length > retryableErrors.length;

  const status: StateDistrictRunsStatus = !canStart
    ? 'idle'
    : completedCount === totalStates
      ? 'complete'
      : !computeRequested
        ? anyChecking
          ? 'checking'
          : 'idle'
        : anyUnsettled
          ? 'computing'
          : completedCount > 0
            ? 'partial'
            : 'error';

  const askAgain = (restartRuns: boolean) => {
    states.forEach((_state, index) => {
      const standing = standings[index];
      if (standing.kind === 'records-failed') {
        void lookups[index].refetch();
      } else if (restartRuns && standing.kind === 'failed') {
        void runs[index].refetch();
      }
    });
  };

  return {
    status,
    districts,
    pendingStates,
    failedStates,
    failedStateLabels,
    error: retryableErrors[0] ?? (hasNoDistrictsFailure ? NO_DISTRICTS_MESSAGE : undefined),
    completedCount,
    totalStates,
    progress,
    canStart,
    canRetry: retryableErrors.length > 0,
    start: () => {
      if (!canStart) {
        return;
      }
      queryClient.setQueryData(computeKey, true);
      askAgain(false);
    },
    retry: () => {
      if (!canStart) {
        return;
      }
      queryClient.setQueryData(computeKey, true);
      askAgain(true);
    },
  };
}

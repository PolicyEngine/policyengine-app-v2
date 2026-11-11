import { useEffect, useMemo, useReducer, useRef } from 'react';
import {
  hashKey,
  useQueries,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import {
  districtsOf,
  mergeStateDistricts,
} from '@/adapters/congressional-district/congressionalDistrictDataAdapter';
import { ReportAdapter } from '@/adapters/ReportAdapter';
import {
  deleteFailedSocietyWideCalculation,
  failedCalculationOf,
  fetchSocietyWideCalculation,
  type EconomyCalculationResponse,
  type SocietyWideReportOutput,
  type StoredFailureDeletion,
} from '@/api/societyWideCalculation';
import {
  US_STATE_DISTRICT_RUN_TIME_LIMIT_MS,
  US_STATE_SOCIETY_WIDE_DURATION_MS,
} from '@/constants/calculationDurations';
import { useRegions } from '@/hooks/useRegions';
import { pollRun, type PolledRun, type PollRunOptions } from '@/libs/calculations/polledRun';
import { ResultPersister } from '@/libs/calculations/ResultPersister';
import { describeCalculationError } from '@/libs/flagship/calculationError';
import { createReportRecords } from '@/libs/flagship/runReport';
import { reportKeys } from '@/libs/queryKeys';
import type { EconomyOutput, Report } from '@/types/ingredients/Report';
import type { USCongressionalDistrictBreakdownItem } from '@/types/metadata/ReportOutputSocietyWideByCongressionalDistrict';
import { createConcurrencyLimit, type ConcurrencyLimit } from '@/utils/concurrencyLimit';
import { getUSStates } from '@/utils/regionStrategies';

/**
 * Requests the state district runs keep in flight per browser tab, counting
 * record requests, run starts, polls, DELETEs of stored failures and result
 * writes. The Public API's production service has about 12 warm request
 * slots (2 instances of 6), and a new instance takes about 6 minutes to
 * start.
 */
export const STATE_DISTRICT_REQUEST_CONCURRENCY = 4;

/** How often a state that is still computing is polled: 51 states make about 10 requests a second. */
export const STATE_DISTRICT_POLL_INTERVAL_MS = 5000;

// The panel puts one or several states' names before these, so they name no state.
const TIME_LIMIT_MESSAGE =
  'Taking much longer than expected. The run may still finish on the server: retry to check it again.';

const NO_DISTRICTS_MESSAGE = 'The result has no congressional districts.';

const UNREADABLE_RESULT_MESSAGE = 'The result could not be read';

// In place of the request's own error: a response body or a browser's message.
const REQUEST_FAILED_MESSAGE = "The request to PolicyEngine's servers failed";

const RECORDS_FAILED_MESSAGE = 'Checking for a saved result failed';

// When Retry's DELETE finds the state's stored result is no longer a failure.
const NEWER_RUN_MESSAGE = "A newer run is on PolicyEngine's servers. Retry to check it";

/**
 * The longest delay a browser timer keeps (2^31 − 1 ms, about 24.8 days); a
 * longer one fires at once. A longer wait is redrawn in steps of this.
 */
const MAX_TIMER_DELAY_MS = 2 ** 31 - 1;

/**
 * A note added to a failed state's reason while Retry waits, and the most
 * time left it is said of. The note is chosen when the view is drawn, from
 * the time left then, and dropped once the wait is over. None gives a time:
 * the seconds left differ between states that failed alike, whose reasons
 * are grouped by their text. Each holds for one state or several, whether or
 * not Retry shows for others.
 */
interface RetryWaitNote {
  upToMs: number;
  note: string;
}

/** For the wait until the Public API accepts a DELETE of the failure: 10 seconds from the failure. */
const UNDER_A_MINUTE_NOTE: RetryWaitNote = {
  upToMs: 60 * 1000,
  note: 'Retry can start a new run in under a minute',
};

/** For a failure the Public API keeps for a while: a US state failure, 2 minutes. */
const FEW_MINUTES_NOTE: RetryWaitNote = {
  upToMs: 15 * 60 * 1000,
  note: 'Retry can start a new run in a few minutes',
};

/** For a failure stored before the Public API kept failures briefly: up to 30 days. */
const HOURS_OR_DAYS_NOTE: RetryWaitNote = {
  upToMs: Infinity,
  note: "Retry can't start a new run for hours or days",
};

/** Why Retry waits for a failed state, and until when. */
interface RetryWait {
  /** When (epoch ms) Retry can be offered again. */
  retryAt: number;
  /** Whether Retry will delete the stored failure first (StateRun.deletesFailure). */
  deletesFailure: boolean;
}

/**
 * The notes a wait can show, shortest first. Only the wait for a DELETE says
 * "under a minute": a failure that is waited out says "a few minutes" for all
 * of its last 15 minutes, so that states answered at different moments in its
 * 2 minutes share one reason.
 */
function retryWaitNotes(wait: RetryWait): RetryWaitNote[] {
  return wait.deletesFailure
    ? [UNDER_A_MINUTE_NOTE, FEW_MINUTES_NOTE, HOURS_OR_DAYS_NOTE]
    : [FEW_MINUTES_NOTE, HOURS_OR_DAYS_NOTE];
}

/** A failed state's reason, with a note while Retry still waits at `now`. */
function withRetryWait(reason: string, wait: RetryWait | undefined, now: number): string {
  const left = wait ? wait.retryAt - now : 0;
  if (!wait || left <= 0) {
    return reason;
  }
  const { note } = retryWaitNotes(wait).find(({ upToMs }) => left <= upToMs)!;
  return `${reason}. ${note}`;
}

/**
 * When (epoch ms) a waiting state's reason next changes: when a shorter note
 * starts to apply, or when the wait ends and Retry is offered.
 */
function nextReasonChangeAt(wait: RetryWait, now: number): number {
  const left = wait.retryAt - now;
  const shorterLimits = retryWaitNotes(wait)
    .map(({ upToMs }) => upToMs)
    .filter((upToMs) => upToMs < left);
  return shorterLimits.length > 0 ? wait.retryAt - Math.max(...shorterLimits) : wait.retryAt;
}

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
  /** The base report as found, without its output, for the write to start from. */
  baseReport: Report;
}

/** A state's run as the query cache holds it: its districts once complete, or null. */
type StateRun = PolledRun<District[] | null> & {
  /**
   * For a failure the Public API keeps for a while: when (epoch ms) Retry
   * can be offered again, either because the Public API will accept a DELETE
   * of the failure or because it no longer keeps it.
   */
  retryAt?: number;
  /**
   * For a failure the Public API keeps and lets the app delete: Retry sends
   * the DELETE first, so that the state's request starts a new run.
   */
  deletesFailure?: boolean;
  /**
   * For a failure the Public API keeps for a while: when (epoch ms) it stops
   * keeping it, as its answer said. After that Retry sends no DELETE, which a
   * request no longer needs.
   */
  keptUntil?: number;
  /** Whether Retry's last DELETE failed; the reason says so in place of the calculation's. */
  deleteFailed?: boolean;
};

/**
 * A state's economy answer, with how long the Public API keeps its failure,
 * and when it will accept a DELETE of it, when it says.
 */
type StateRunAnswer = EconomyCalculationResponse<SocietyWideReportOutput> & {
  retryWaitMs?: number;
  deleteWaitMs?: number;
};

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
  /**
   * The failed states whose records or run failed, by name, each with its
   * own error, in the same order; Retry asks for them again.
   */
  calculationFailures: Array<{ label: string; error: string }>;
  /** The failed states whose result has no districts, by name; Retry does not ask for them. */
  noDistrictStateLabels: string[];
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
  /**
   * Whether Retry would ask again for a failed state or failed records. A
   * state whose failure the Public API keeps counts only once the Public API
   * will accept a DELETE of it, or, when its answer does not say, once it no
   * longer keeps it, counted from when the failure arrived.
   */
  canRetry: boolean;
  /** Computes every state whose districts are not in, for every view of this year. */
  start: () => void;
  /**
   * Asks again for each failed state that can run again, and failed records;
   * a result with no districts stays. A state whose failure the Public API
   * keeps and lets the app delete has it deleted first, so it runs again.
   */
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
 * The base reports whose result write has been queued, sent or done, per
 * query client. A view that closes drops its runs' results, so another
 * view polls those states again, possibly before the first writes finish:
 * this lets each result be written once.
 */
const writtenReports = new WeakMap<QueryClient, Set<string>>();

function writtenReportsFor(queryClient: QueryClient): Set<string> {
  let reportIds = writtenReports.get(queryClient);
  if (!reportIds) {
    reportIds = new Set();
    writtenReports.set(queryClient, reportIds);
  }
  return reportIds;
}

/**
 * The DELETEs of states' stored failures that are queued or sent, per query
 * client, by the hash of the state's run key. A view that closes leaves its
 * sent DELETE to finish, and puts the run back as it was before the press;
 * Retry in a view opened meanwhile waits for that DELETE's answer instead of
 * sending a second one.
 */
const deletesInFlight = new WeakMap<QueryClient, Map<string, Promise<StoredFailureDeletion>>>();

function deletesInFlightFor(queryClient: QueryClient): Map<string, Promise<StoredFailureDeletion>> {
  let deletions = deletesInFlight.get(queryClient);
  if (!deletions) {
    deletions = new Map();
    deletesInFlight.set(queryClient, deletions);
  }
  return deletions;
}

/** Whether an error is the request limit dropping a task that never started. */
function isAbortError(error: unknown): boolean {
  return error instanceof Error || error instanceof DOMException
    ? error.name === 'AbortError'
    : false;
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
  ).catch((error: unknown) => {
    // The state shows a short reason, so the error itself is logged.
    if (!signal.aborted) {
      console.error("[useStateDistrictRuns] Could not look up a state's records:", error);
    }
    throw error;
  });
  const report = ReportAdapter.fromMetadata(metadata);
  return {
    reportId: String(report.id),
    reportStatus: report.status,
    districts:
      report.status === 'complete'
        ? storedDistricts(report.output as EconomyOutput | null | undefined)
        : null,
    baseReport: { ...report, output: null },
  };
}

/** A complete base report's districts; null, so the state runs, when they cannot be read. */
function storedDistricts(output: EconomyOutput | null | undefined): District[] | null {
  try {
    return districtsOf(output);
  } catch (error) {
    console.error('[useStateDistrictRuns] Could not read a saved state result:', error);
    return null;
  }
}

const STATE_RUN_POLL_OPTIONS: PollRunOptions<SocietyWideReportOutput, SocietyWideReportOutput> = {
  expectedMs: US_STATE_SOCIETY_WIDE_DURATION_MS,
  timeLimitMs: US_STATE_DISTRICT_RUN_TIME_LIMIT_MS,
  timeLimitMessage: TIME_LIMIT_MESSAGE,
  failureMessage: 'The calculation failed',
  requestFailureMessage: REQUEST_FAILED_MESSAGE,
  readResult: (result) => ({ result }),
};

/**
 * Writes a state's result, as received, to its base report, so that it is
 * not calculated again. Like the records, the write is deliberately not
 * associated with the user. A failed write is logged; the districts still
 * show. Errors are never written. Answers whether the write succeeded.
 */
async function saveStateResult(
  queryClient: QueryClient,
  records: StateDistrictRecords,
  run: PolledRun<SocietyWideReportOutput>,
  year: string
): Promise<boolean> {
  const reportId = records.reportId;
  // The write starts from the cached report and caches the result under the
  // base report's ID, where a report page opening it reads: start from the
  // whole report, with its simulations, rather than an empty one.
  if (!queryClient.getQueryData<Report>(reportKeys.byId(reportId))) {
    queryClient.setQueryData(reportKeys.byId(reportId), records.baseReport);
  }
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
    return true;
  } catch (error) {
    console.error('[useStateDistrictRuns] Failed to save a state result:', error);
    return false;
  }
}

/**
 * A failed calculation's reason: short and the same for states that failed
 * alike (the message itself carries a correlation ID). The wait, if any, is
 * added when the view is drawn (withRetryWait).
 */
function calculationFailureReason(message: string): string {
  return describeCalculationError(message).title;
}

/**
 * Asks for a state's economy result. The Public API answers a calculation
 * that failed with 502 and an error body, which the fetch throws: that is the
 * state's answer, not a failed poll, so it becomes the state's error at once,
 * with how long the Public API keeps it (`retry_after_seconds`) and when it
 * will accept a DELETE of it (`delete_after_seconds`). Any other failure,
 * such as a 502 from a proxy with no such body, is still a failed poll.
 */
async function fetchStateRun(
  { reformPolicyId, baselinePolicyId, year }: Required<StateDistrictRunsRequest>,
  region: string
): Promise<StateRunAnswer> {
  try {
    // Only the region and year: the Public API picks the state's dataset.
    return await fetchSocietyWideCalculation('us', reformPolicyId, baselinePolicyId, {
      region,
      time_period: year,
    });
  } catch (error) {
    const failure = failedCalculationOf(error);
    if (failure && error instanceof Error) {
      const { retryAfterSeconds, deleteAfterSeconds } = failure;
      return {
        status: 'error',
        result: null,
        error: calculationFailureReason(error.message),
        // 0 means the Public API no longer keeps the failure: no wait, and no DELETE needed.
        retryWaitMs: retryAfterSeconds === null ? undefined : retryAfterSeconds * 1000,
        // 0 means the Public API accepts a DELETE now: Retry deletes first, with no wait.
        deleteWaitMs: deleteAfterSeconds === null ? undefined : deleteAfterSeconds * 1000,
      };
    }
    throw error;
  }
}

/**
 * Sends the DELETE of a state's stored failure through the tab's request
 * limit, or, when one is already queued or sent for that state, waits for
 * its answer. A DELETE the limit dropped before sending it, because its
 * view closed, is sent again.
 */
async function sendOrJoinDelete(
  queryClient: QueryClient,
  { reformPolicyId, baselinePolicyId, year }: Required<StateDistrictRunsRequest>,
  region: string,
  signal: AbortSignal
): Promise<StoredFailureDeletion> {
  const key = hashKey(stateDistrictRunQueryKey({ reformPolicyId, baselinePolicyId, year }, region));
  const deletions = deletesInFlightFor(queryClient);
  const earlier = deletions.get(key);
  if (earlier) {
    try {
      return await earlier;
    } catch (error) {
      if (!isAbortError(error) || signal.aborted) {
        throw error;
      }
    }
  }
  const deletion = requestLimitFor(queryClient).run(
    () =>
      deleteFailedSocietyWideCalculation('us', reformPolicyId, baselinePolicyId, {
        region,
        time_period: year,
      }),
    signal
  );
  deletions.set(key, deletion);
  try {
    return await deletion;
  } finally {
    if (deletions.get(key) === deletion) {
      deletions.delete(key);
    }
  }
}

/**
 * Before Retry asks again for a state whose failure the Public API keeps,
 * asks it to delete that failure, through the tab's request limit, so the
 * state's request that follows starts a new run. Answers with the state's
 * run when the DELETE leaves it failed, or null to go on to the request:
 *
 * - deleted, or nothing stored: null.
 * - refused as too soon: the same failure, with Retry hidden for the
 *   seconds the answer gives.
 * - refused because the stored result is not a failure (a newer run is
 *   computing or done): failed with a short reason, and Retry asks without
 *   a DELETE.
 * - any other answer, or a failed request: failed with a short reason, and
 *   Retry deletes again while the Public API may still keep the failure.
 *
 * A DELETE still queued when the view closes is dropped, and the state
 * stays as it was. The answer to one already sent is kept for a view opened
 * later, and a Retry while it is in flight waits for it (sendOrJoinDelete).
 */
async function deleteStoredFailure(
  queryClient: QueryClient,
  { reformPolicyId, baselinePolicyId, year }: Required<StateDistrictRunsRequest>,
  region: string,
  failed: StateRun,
  signal: AbortSignal
): Promise<StateRun | null> {
  const runKey = stateDistrictRunQueryKey({ reformPolicyId, baselinePolicyId, year }, region);
  // Each outcome is also written to the cache, so it holds if the view closed
  // while the DELETE was in flight: the query then goes back to this state,
  // not to the one before the press, and the cancelled query's own answer is
  // dropped. Only while the cache still holds the failure the DELETE was sent
  // for, so an answer that arrives late never replaces a newer run.
  const settle = (next: StateRun): StateRun => {
    queryClient.setQueryData<StateRun>(runKey, (current) =>
      current === failed ? next : undefined
    );
    return next;
  };
  let deletion: StoredFailureDeletion;
  try {
    deletion = await sendOrJoinDelete(
      queryClient,
      { reformPolicyId, baselinePolicyId, year },
      region,
      signal
    );
  } catch (error) {
    if (signal.aborted && isAbortError(error)) {
      throw error;
    }
    // The state shows a short reason, so the error itself is logged.
    console.error("[useStateDistrictRuns] Could not delete a state's stored failure:", error);
    return settle({ ...failed, deleteFailed: true, retryAt: undefined });
  }
  switch (deletion.outcome) {
    case 'deleted':
    case 'nothing-stored':
      // No failure is stored now, so the next Retry sends the request alone.
      settle({ ...failed, deletesFailure: false, deleteFailed: false });
      return null;
    case 'too-soon':
      // Counted from the answer's arrival, so never earlier than the Public API accepts it.
      return settle({
        ...failed,
        deleteFailed: false,
        retryAt: Date.now() + deletion.deleteAfterSeconds * 1000,
      });
    case 'not-a-failure':
      return settle({
        ...failed,
        error: NEWER_RUN_MESSAGE,
        deleteFailed: false,
        retryAt: undefined,
        deletesFailure: false,
      });
  }
}

/**
 * Sends one poll of a state's run through the tab's request limit, and
 * writes its result to the state's base report when that report does not
 * hold one yet. A failed state whose failure the Public API lets the app
 * delete has it deleted first (deleteStoredFailure), while the Public API
 * may still keep it (keptUntil). A poll still queued
 * when the view closes is dropped; one already sent still writes its
 * result. A result whose districts cannot be read fails the state, and is
 * not written.
 */
async function pollStateRun(
  queryClient: QueryClient,
  { reformPolicyId, baselinePolicyId, year }: Required<StateDistrictRunsRequest>,
  region: string,
  records: StateDistrictRecords,
  signal: AbortSignal
): Promise<StateRun> {
  const request = { reformPolicyId, baselinePolicyId, year };
  const runKey = stateDistrictRunQueryKey(request, region);
  const failed = queryClient.getQueryData<StateRun>(runKey);
  const mayStillBeKept = failed?.keptUntil === undefined || Date.now() < failed.keptUntil;
  if (failed?.status === 'error' && failed.deletesFailure && mayStillBeKept) {
    const stillFailed = await deleteStoredFailure(queryClient, request, region, failed, signal);
    if (stillFailed) {
      return stillFailed;
    }
  }
  let kept: Pick<StateRunAnswer, 'retryWaitMs' | 'deleteWaitMs'> = {};
  const run = await requestLimitFor(queryClient).run(() => {
    // Read when the request is sent, so the clock starts then, not in the queue.
    const previous = queryClient.getQueryData<StateRun>(runKey);
    return pollRun(
      async () => {
        const answer = await fetchStateRun(request, region);
        kept = answer;
        return answer;
      },
      previous && { ...previous, result: null },
      STATE_RUN_POLL_OPTIONS
    );
  }, signal);
  // Each wait is the seconds the Public API had left when it answered, counted from the answer's
  // arrival, so never earlier than it accepts a DELETE or stops keeping the failure.
  const keptUntil = kept.retryWaitMs === undefined ? undefined : Date.now() + kept.retryWaitMs;
  if (run.status === 'error' && kept.deleteWaitMs !== undefined) {
    const retryAt = kept.deleteWaitMs > 0 ? Date.now() + kept.deleteWaitMs : undefined;
    return { ...run, result: null, retryAt, keptUntil, deletesFailure: true };
  }
  // A wait of 0 is no wait, as when the answer does not say.
  if (run.status === 'error' && kept.retryWaitMs) {
    return { ...run, result: null, retryAt: keptUntil, keptUntil };
  }
  if (run.status !== 'complete') {
    return { ...run, result: null };
  }
  let districts: District[] | null;
  try {
    districts = districtsOf(run.result);
  } catch (error) {
    console.error('[useStateDistrictRuns] Could not read a state result:', error);
    return { ...run, status: 'error', result: null, error: UNREADABLE_RESULT_MESSAGE };
  }
  const written = writtenReportsFor(queryClient);
  if (records.reportStatus !== 'complete' && !written.has(records.reportId)) {
    written.add(records.reportId);
    // The write waits for a place in the same limit, with no signal, so it is
    // counted in flight and still sent when the view closes.
    void requestLimitFor(queryClient)
      .run(() => saveStateResult(queryClient, records, run, year))
      .then((saved) => {
        if (!saved) {
          // Only a poll whose result a closing view dropped asks for this
          // state again in this tab, and may then try the write again;
          // otherwise the failure is only logged, and a later page load
          // computes the state again.
          written.delete(records.reportId);
        }
      });
  }
  return { ...run, result: districts };
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
  | { kind: 'failed'; error: string; wait?: RetryWait };

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
 * same run again. A state whose run failed, and whose failure the Public API
 * keeps, offers Retry once the Public API will accept a DELETE of that
 * failure; Retry sends the DELETE, then the state's request, which starts a
 * new run.
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
      return { kind: 'records-failed', error: RECORDS_FAILED_MESSAGE };
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
      return {
        kind: 'failed',
        error: data.deleteFailed
          ? REQUEST_FAILED_MESSAGE
          : (data.error ?? STATE_RUN_POLL_OPTIONS.failureMessage),
        wait: data.retryAt
          ? { retryAt: data.retryAt, deletesFailure: !!data.deletesFailure }
          : undefined,
      };
    }
    return { kind: 'waiting' };
  });

  // A failed state Retry has to wait for is not asked again, offers no Retry,
  // and says so in its reason, until its retryAt; this view is drawn again
  // then, and whenever the reason's note changes.
  const now = Date.now();
  const pendingStates: string[] = [];
  const failedStates: string[] = [];
  const failedStateLabels: string[] = [];
  const calculationFailures: Array<{ label: string; error: string }> = [];
  const noDistrictStateLabels: string[] = [];
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
        calculationFailures.push({
          label: state.label,
          error: withRetryWait(
            standing.error,
            standing.kind === 'failed' ? standing.wait : undefined,
            now
          ),
        });
        failedStates.push(state.value);
        failedStateLabels.push(state.label);
        settledShare += 1;
        return;
      case 'no-districts':
        noDistrictStateLabels.push(state.label);
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

  const canAskAgain = (standing: StateStanding) =>
    standing.kind === 'records-failed' ||
    (standing.kind === 'failed' && (standing.wait?.retryAt ?? 0) <= now);
  const nextRedrawAt = Math.min(
    ...standings.map((standing) =>
      standing.kind === 'failed' && standing.wait && standing.wait.retryAt > now
        ? nextReasonChangeAt(standing.wait, now)
        : Infinity
    )
  );
  // Each redraw sets the next timer, so a wait longer than a timer keeps is
  // redrawn in steps until its reason changes. A timer can run late after
  // the computer sleeps or while the tab is in the background, so the view is
  // also drawn again when the tab is shown or focused.
  const [redrawCount, redraw] = useReducer((count: number) => count + 1, 0);
  useEffect(() => {
    if (nextRedrawAt === Infinity) {
      return undefined;
    }
    const timer = setTimeout(redraw, Math.min(nextRedrawAt - Date.now(), MAX_TIMER_DELAY_MS));
    const redrawWhenShown = () => {
      if (document.visibilityState === 'visible') {
        redraw();
      }
    };
    document.addEventListener('visibilitychange', redrawWhenShown);
    window.addEventListener('focus', redraw);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', redrawWhenShown);
      window.removeEventListener('focus', redraw);
    };
  }, [nextRedrawAt, redrawCount]);

  // A request still in flight is joined rather than sent again
  // (cancelRefetch: false), so a second press before the view is drawn again
  // asks for no state twice, and sends no second DELETE.
  const askAgain = (restartRuns: boolean) => {
    states.forEach((_state, index) => {
      const standing = standings[index];
      if (standing.kind === 'records-failed') {
        void lookups[index].refetch({ cancelRefetch: false });
      } else if (restartRuns && standing.kind === 'failed' && canAskAgain(standing)) {
        void runs[index].refetch({ cancelRefetch: false });
      }
    });
  };

  return {
    status,
    districts,
    pendingStates,
    failedStates,
    failedStateLabels,
    calculationFailures,
    noDistrictStateLabels,
    error:
      calculationFailures[0]?.error ??
      (noDistrictStateLabels.length > 0 ? NO_DISTRICTS_MESSAGE : undefined),
    completedCount,
    totalStates,
    progress,
    canStart,
    canRetry: standings.some(canAskAgain),
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

import { useMemo, useRef } from 'react';
import { useQueries, useQueryClient, type QueryClient } from '@tanstack/react-query';
import {
  districtsOf,
  mergeStateDistricts,
} from '@/adapters/congressional-district/congressionalDistrictDataAdapter';
import { ReportAdapter } from '@/adapters/ReportAdapter';
import { useRegions } from '@/hooks/useRegions';
import { createReportRecords } from '@/libs/flagship/runReport';
import type { EconomyOutput, Report } from '@/types/ingredients/Report';
import type { USCongressionalDistrictBreakdownItem } from '@/types/metadata/ReportOutputSocietyWideByCongressionalDistrict';
import { createConcurrencyLimit, type ConcurrencyLimit } from '@/utils/concurrencyLimit';
import { getUSStates } from '@/utils/regionStrategies';

/**
 * Requests the state district runs keep in flight per browser tab, counting
 * record requests, run starts and polls. API v1 production has about 12
 * warm request slots (2 instances of 6), and a new instance takes about 6
 * minutes to start.
 */
export const STATE_DISTRICT_REQUEST_CONCURRENCY = 4;

type District = USCongressionalDistrictBreakdownItem;

export interface StateDistrictRunsRequest {
  reformPolicyId?: string;
  baselinePolicyId?: string;
  year?: string;
}

/** A state's records as the lookup finds them on API v1. */
export interface StateDistrictRecords {
  /** The state's base report. */
  reportId: string;
  reportStatus: Report['status'];
  /** The base report's districts, only when it is complete and holds them. */
  districts: District[] | null;
}

export type StateDistrictRunsStatus = 'checking' | 'idle' | 'complete';

export interface StateDistrictRuns {
  /**
   * `checking` while the states' records are looked up; `idle` until the
   * remaining states are computed; `complete` once every state's districts
   * are in.
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
  /** States whose districts are in. */
  completedCount: number;
  /** States the report covers: the 50 states and DC. */
  totalStates: number;
  /** False until the report's policies and year, and the states, are known. */
  canStart: boolean;
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
 * base report, which prevents recalculation: API v1 reuses simulations by
 * population and policy, and base reports by both simulations, year and
 * cache version, so a later nationwide view, or anyone's own report for
 * that state with the same policies and year, finds the result there.
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

/**
 * A nationwide US report's congressional districts, from each state's own
 * run on the state-level dataset rather than from the nationwide result.
 * When the view opens, each of the 50 states and DC has its records
 * created or reused on API v1, and a state whose base report already holds
 * its result shows its districts at once.
 *
 * Every view of the same report and year shares the records through their
 * query keys, which are kept for the session.
 */
export function useStateDistrictRuns(request: StateDistrictRunsRequest): StateDistrictRuns {
  const { reformPolicyId, baselinePolicyId, year } = request;
  const queryClient = useQueryClient();
  const { data: regions } = useRegions('us');
  const states = useMemo(() => getUSStates(regions ?? []), [regions]);
  const hasInputs = !!reformPolicyId && !!baselinePolicyId && !!year;
  const canStart = hasInputs && states.length > 0;

  const lookups = useQueries({
    queries: states.map((state) => ({
      queryKey: stateDistrictRecordsQueryKey(request, state.value),
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        lookUpStateRecords(
          queryClient,
          { reformPolicyId: reformPolicyId!, baselinePolicyId: baselinePolicyId!, year: year! },
          state.value,
          signal
        ),
      enabled: canStart,
      retry: false,
      staleTime: Infinity,
      gcTime: Infinity,
    })),
  });

  const pendingStates: string[] = [];
  const failedStates: string[] = [];
  const failedStateLabels: string[] = [];
  const stateDistricts: Array<District[] | null> = [];
  let checking = false;

  states.forEach((state, index) => {
    const lookup = lookups[index];
    if (lookup.isError) {
      failedStates.push(state.value);
      failedStateLabels.push(state.label);
      return;
    }
    const districts = lookup.data?.districts ?? null;
    if (districts) {
      stateDistricts.push(districts);
      return;
    }
    if (!lookup.data) {
      checking = true;
    }
    pendingStates.push(state.value);
  });

  const completedCount = stateDistricts.length;
  const districts = useMergedDistricts(stateDistricts);

  const status: StateDistrictRunsStatus =
    canStart && completedCount === states.length
      ? 'complete'
      : canStart && checking
        ? 'checking'
        : 'idle';

  return {
    status,
    districts,
    pendingStates,
    failedStates,
    failedStateLabels,
    completedCount,
    totalStates: states.length,
    canStart,
  };
}

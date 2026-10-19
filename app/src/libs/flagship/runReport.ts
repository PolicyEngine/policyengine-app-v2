import type { QueryClient } from '@tanstack/react-query';
import { fetchBudgetWindow } from '@/api/budgetWindow';
import {
  LocalStorageFlagshipReportStore,
  type FlagshipReportRecord,
  type FlagshipReportStore,
} from '@/api/flagshipReportStore';
import { createPolicy } from '@/api/policy';
import { createReport } from '@/api/report';
import { createSimulation } from '@/api/simulation';
import { fetchSocietyWideCalculation } from '@/api/societyWideCalculation';
import { CURRENT_YEAR, FOREVER } from '@/constants';
import { CountryId } from '@/libs/countries';
import { findRegionalOutput } from '@/libs/flagship/regionalOutput';
import { baselineProvisions, customBaseline } from '@/libs/flagship/reportBaseline';
import type { ParameterMetadataCollection } from '@/types/metadata/parameterMetadata';
import type { Parameter } from '@/types/subIngredients/parameter';
import { ValueInterval } from '@/types/subIngredients/valueInterval';
import { coercePolicyParameterValue, resolvePolicyParameterValueSpec } from '@/utils/valueCoercion';
import { parseReportMeta, stampReportMeta, type ReportParseResult } from './reportSchema';

/**
 * The run bridge: turns a set of provisions (from a draft reform or a
 * tracked bill) into a full society-wide report — policy → baseline +
 * reform simulations → report record — and returns the report's link,
 * whose page auto-starts the calculation and renders the chart
 * dashboard. With accounts the link is the report's user-report ID,
 * which anyone can open with its title and provisions; otherwise it is
 * the v1 report's ID.
 */
export interface RunReportProvision {
  path: string;
  breadcrumb: string;
  unit: string | null;
  baselineValue: any;
  value: any;
  /** Dated changes, when the provision varies over time (see DraftProvision). */
  intervals?: ValueInterval[];
  /** How a value set from one year on grows, from when, and how it rounds (see DraftProvision). */
  growth?: string;
  growthStart?: number;
  growthBase?: number;
  growthRoundTo?: number;
  growthRound?: 'nearest' | 'down' | 'up';
}

/**
 * What a report compared the reform with, when not current law: a saved
 * reform, run as the baseline policy.
 */
export interface FlagshipReportBaseline {
  /** The saved reform, when the run came from one. */
  reformId: string | null;
  /** The baseline policy on the API. */
  policyId: string;
  /** Its name: the report reads "Compared with <label>". */
  label: string;
}

/** Provenance shown in the flagship report header, stashed per report. */
export interface FlagshipReportMeta {
  title: string;
  /** e.g. "Utah · Introduced" for bills, "Hand-built draft" for drafts */
  sourceNote: string;
  provisions: RunReportProvision[];
  createdAt: string;
  /** The budget window asked for with the run, which the report opens running. */
  budgetWindow?: { startYear: number; windowSize: number };
  /** What the reform is compared with; current law when absent, as in older reports. */
  baseline?: FlagshipReportBaseline;
}

export const REPORT_META_KEY = 'pe-flagship-report-meta';

/**
 * Provenance from signed-in runs. It is the account's (its record carries
 * it to every device), so it is kept for this page session only, never in
 * localStorage where the next person on this browser would find it, and
 * is dropped on sign-out.
 */
const accountReportMeta = new Map<string, FlagshipReportMeta>();

function rememberAccountReportMeta(userReportId: string, meta: FlagshipReportMeta): void {
  accountReportMeta.set(userReportId, meta);
}

/** Drops the signed-in session's report provenance (on sign-out). */
export function forgetAccountReportMeta(): void {
  accountReportMeta.clear();
}

/** Every report's provenance as stored, of any schema version (see reportSchema). */
function readAllMeta(): Record<string, unknown> {
  try {
    return JSON.parse(localStorage.getItem(REPORT_META_KEY) ?? '{}');
  } catch {
    return {};
  }
}

export function saveReportMeta(userReportId: string, unstamped: FlagshipReportMeta): void {
  const meta = stampReportMeta(unstamped);
  try {
    localStorage.setItem(
      REPORT_META_KEY,
      JSON.stringify({ ...readAllMeta(), [userReportId]: meta })
    );
  } catch {
    // Provenance header simply won't show if storage is unavailable.
  }
}

/** The stash, when it holds this report's provenance; a stash that is not a map holds none. */
function stashWith(userReportId: string): Record<string, unknown> | null {
  const all: unknown = readAllMeta();
  if (!all || typeof all !== 'object' || Array.isArray(all) || !Object.hasOwn(all, userReportId)) {
    return null;
  }
  return all as Record<string, unknown>;
}

/**
 * The report's stored provenance, parsed: null when none is stored,
 * otherwise the current shape or why it can't be read.
 */
export function readReportMetaResult(
  userReportId: string
): ReportParseResult<FlagshipReportMeta> | null {
  const all = stashWith(userReportId);
  return all ? parseReportMeta(all[userReportId]) : null;
}

/** The report's provenance in the current shape; null when none is stored or it can't be read. */
export function readReportMeta(userReportId: string): FlagshipReportMeta | null {
  const accountMeta = accountReportMeta.get(userReportId);
  if (accountMeta) {
    return accountMeta;
  }
  const result = readReportMetaResult(userReportId);
  return result?.ok ? result.value : null;
}

/** Drops the report's stored provenance; the other reports' stays as stored. */
export function removeReportMeta(userReportId: string): void {
  const all = stashWith(userReportId);
  if (!all) {
    return;
  }
  const { [userReportId]: _removed, ...rest } = all;
  try {
    localStorage.setItem(REPORT_META_KEY, JSON.stringify(rest));
  } catch {
    // It stays stored; the report still opens without it.
  }
}

/**
 * A report record's provenance, as the run's own details would give it:
 * how a report opened on another device, or after a reload, still shows
 * its title, source, changes, budget window and comparison. A record
 * without provisions has nothing to show, so it gives none. The record
 * keeps only the link to its baseline reform, so the caller names it.
 */
export function reportMetaFromRecord(
  record: FlagshipReportRecord | null | undefined,
  reportYear: string | undefined,
  baseline?: FlagshipReportBaseline
): FlagshipReportMeta | null {
  if (!record || record.provisions.length === 0) {
    return null;
  }
  const startYear = Number(reportYear);
  return {
    title: record.title ?? '',
    sourceNote: record.sourceNote ?? '',
    provisions: record.provisions,
    createdAt: record.createdAt,
    ...(record.budgetWindowYears && record.budgetWindowYears > 1 && startYear
      ? { budgetWindow: { startYear, windowSize: record.budgetWindowYears } }
      : {}),
    ...(baseline && { baseline }),
  };
}

/**
 * A saved reform to compare the reform with, in place of current law.
 * From Build it brings its parameters, made into the baseline policy
 * (the API reuses an identical one); a re-run of a report brings the
 * baseline policy that report already has.
 */
export interface RunReportBaseline {
  /** The saved reform, when known. */
  reformId?: string | null;
  /** Its name, for the report's labels. */
  label: string;
  /** Its parameters, as the reform store keeps them. */
  parameters?: Parameter[];
  /** The baseline policy itself, when a report already has one. */
  policyId?: number;
}

export interface RunFlagshipReportArgs {
  countryId: CountryId;
  title: string;
  sourceNote: string;
  provisions: RunReportProvision[];
  /** Numeric current-law policy id from metadata (US 2, UK 1). */
  currentLawId: number;
  /** Saved reform this run came from, for the central report record. */
  reformId?: string | null;
  /** The year to simulate; the current year when unset. */
  year?: number;
  /**
   * The population: a state or congressional district as the API names
   * it ("state/ca", "congressional_district/CA-01"); the whole country
   * when unset.
   */
  region?: string;
  /** Years of budget to score from `year` alongside the report; none when unset or 1. */
  windowYears?: number;
  /** What the reform is compared with; current law when unset. */
  baseline?: RunReportBaseline;
  /**
   * With accounts (US/UK): the report store for this session's user, the
   * account or this browser's unauthenticated user. The run then writes
   * exactly one `/v2/user-reports` row — with the title, source note,
   * provisions and reform links — instead of the browser record.
   */
  accountReportStore?: FlagshipReportStore | null;
  /** The model's parameters, to check and type each value as v2 does. */
  parameters?: ParameterMetadataCollection;
  /**
   * This session's query cache. A state run whose results are already in
   * a nationwide result held there (see regionalOutput) starts no
   * calculation of its own: its report opens with them.
   */
  queryClient?: QueryClient;
}

/**
 * The API's per-parameter period map: each dated change keyed
 * "start.end", or the single value from the current year onward.
 */
export function provisionPeriods(
  provision: Pick<RunReportProvision, 'value' | 'intervals'>
): Record<string, any> {
  if (provision.intervals && provision.intervals.length > 0) {
    return Object.fromEntries(
      provision.intervals.map((interval) => [
        `${interval.startDate}.${interval.endDate}`,
        interval.value,
      ])
    );
  }
  return { [`${CURRENT_YEAR}-01-01.${FOREVER}`]: provision.value };
}

/**
 * A provision's values as v2 sends them (convertParametersToPolicyJson):
 * numbers from numeric text, booleans as booleans, infinity as the API
 * spells it, and a value of the wrong kind refused. A parameter the
 * metadata lacks (a bill's contributed switch) is sent as it is.
 */
function coercePeriods(
  path: string,
  periods: Record<string, any>,
  parameters: ParameterMetadataCollection | undefined
): Record<string, any> {
  const metadata = parameters?.[path];
  if (!metadata || metadata.type !== 'parameter') {
    return periods;
  }
  const spec = resolvePolicyParameterValueSpec(path, parameters!);
  return Object.fromEntries(
    Object.entries(periods).map(([period, value]) => [
      period,
      coercePolicyParameterValue(value, spec, path),
    ])
  );
}

/**
 * Creates (or, since the API dedupes identical policies, finds) the reform
 * policy for a set of provisions — each with its dated changes, or its
 * single value from the current year onward. The policy carries only the
 * changes, never a label: names and titles belong to the user's records,
 * so identical changes always share one policy.
 */
export async function createReformPolicy(
  countryId: CountryId,
  provisions: Array<Pick<RunReportProvision, 'path' | 'value' | 'intervals'>>,
  /** The model's parameters: each value is checked and typed against them, as v2's policies are. */
  parameters?: ParameterMetadataCollection
): Promise<number> {
  const data = Object.fromEntries(
    provisions.map((p) => [p.path, coercePeriods(p.path, provisionPeriods(p), parameters)])
  );
  const policyResponse = await createPolicy(countryId, { data });
  return Number(policyResponse.result.policy_id);
}

/**
 * Runs a report and records it. Answers the report's link: the account
 * row's ID with accounts, otherwise the v1 report's (see reportLink).
 */
export async function runFlagshipReport({
  countryId,
  title,
  sourceNote,
  provisions,
  currentLawId,
  reformId,
  year = Number(CURRENT_YEAR),
  region,
  windowYears,
  baseline: requestedBaseline,
  accountReportStore,
  parameters,
  queryClient,
}: RunFlagshipReportArgs): Promise<string> {
  if (provisions.length === 0) {
    throw new Error('Cannot run a report with no provisions');
  }

  // Compared with current law, unless a saved reform is chosen instead.
  // Neither policy carries a name: names live on the user's records.
  const comparison = customBaseline(requestedBaseline, currentLawId);
  const [reformPolicyId, baselineId] = await Promise.all([
    createReformPolicy(countryId, provisions, parameters),
    comparison?.policyId ??
      (comparison
        ? createReformPolicy(countryId, baselineProvisions(comparison), parameters)
        : currentLawId),
  ]);

  const [baseline, reform] = await Promise.all([
    createSimulation(countryId, {
      population_id: region ?? countryId,
      population_type: 'geography',
      policy_id: baselineId,
    }),
    createSimulation(countryId, {
      population_id: region ?? countryId,
      population_type: 'geography',
      policy_id: reformPolicyId,
    }),
  ]);

  const payload = {
    simulation_1_id: Number(baseline.result.simulation_id),
    simulation_2_id: Number(reform.result.simulation_id),
    year: String(year),
  };

  // The v1 report comes first. Then exactly one record of it: through the
  // API with accounts, whose ID is the report's link (anyone can open it),
  // otherwise this browser's flagship record, with the v1 report's ID as
  // the link (v3 never writes the legacy report keys).
  const reportMetadata = await createReport(countryId, payload);
  const reportId = String(reportMetadata.id);
  const budgetWindow =
    windowYears && windowYears > 1 ? { startYear: year, windowSize: windowYears } : undefined;
  const meta: FlagshipReportMeta = {
    title,
    sourceNote,
    provisions,
    createdAt: new Date().toISOString(),
    ...(budgetWindow && { budgetWindow }),
    ...(comparison && {
      baseline: {
        reformId: comparison.reformId ?? null,
        policyId: String(baselineId),
        label: comparison.label,
      },
    }),
  };
  const record = {
    countryId,
    apiReportId: reportId,
    title: title || null,
    sourceNote: sourceNote || null,
    provisions,
    year: String(year),
    reformId: reformId ?? null,
    // Kept on the record so the report shows its window on any device.
    budgetWindowYears: budgetWindow?.windowSize ?? null,
    // The comparison's name is its saved reform's, read from the link.
    baselineReformId: comparison?.reformId ?? null,
  };

  let link = reportId;
  if (accountReportStore) {
    // A failure fails the run, so a report that opens is one that was saved.
    link = (await accountReportStore.create(record)).id;
    rememberAccountReportMeta(link, meta);
  } else {
    saveReportMeta(reportId, meta);
    // Best-effort: the run already succeeded, and the link opens without it.
    try {
      await new LocalStorageFlagshipReportStore().create(record);
    } catch {
      // The report still opens by its v1 report ID.
    }
  }

  // Start the report's own calculation now, not when its page opens: the
  // first request queues the job, so a tab closed right after "Run" still
  // gets its result, waiting for the link. The page asks with the same
  // reform, baseline, region and year, so it checks on this job.
  // A failure here never fails the run: the report page asks again.
  // A state already in a nationwide result this session holds needs no
  // run: its report opens with that result (see regionalOutput).
  const fromNational =
    !!queryClient &&
    !!region &&
    !!findRegionalOutput(queryClient, {
      countryId,
      reformPolicyId: String(reformPolicyId),
      baselinePolicyId: String(baselineId),
      region,
      year: String(year),
    });
  if (!fromNational) {
    void Promise.resolve()
      .then(() =>
        fetchSocietyWideCalculation(countryId, String(reformPolicyId), String(baselineId), {
          region: region ?? countryId,
          time_period: String(year),
        })
      )
      .catch(() => undefined);
  }

  // The window was asked for with the run: start it now, alongside the
  // report, rather than when the report page opens. The first request
  // submits the batch; the report's section checks on the same one.
  if (budgetWindow) {
    void fetchBudgetWindow(countryId, String(reformPolicyId), String(baselineId), {
      region: region ?? countryId,
      ...budgetWindow,
    }).catch(() => {
      // The report's section asks again, and shows any error there.
    });
  }

  return link;
}

/**
 * Query keys for this session's reports, as Your reforms lists them by
 * reform (scoped to whose saved work they are, see V3SavedWork), and for
 * where each one stands on the API.
 */
export const flagshipReportQueryKeys = {
  all: ['flagship-reports'] as const,
  mine: (scope: string, countryId: string) => ['flagship-reports', scope, countryId] as const,
  statuses: ['flagship-report-status'] as const,
  status: (countryId: string, apiReportId: string) =>
    ['flagship-report-status', countryId, apiReportId] as const,
  /** A report's baseline simulation, as the API's metadata (not the adapted Simulation). */
  baselineSimulation: (countryId: string, simulationId: string) =>
    ['flagship-report-baseline-simulation', countryId, simulationId] as const,
};

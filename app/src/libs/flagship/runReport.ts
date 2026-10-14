import { fetchBudgetWindow } from '@/api/budgetWindow';
import { createPolicy } from '@/api/policy';
import { createReportAndAssociateWithUser } from '@/api/report';
import { createSimulation } from '@/api/simulation';
import { fetchSocietyWideCalculation } from '@/api/societyWideCalculation';
import { CURRENT_YEAR, FOREVER, MOCK_USER_ID } from '@/constants';
import { CountryId } from '@/libs/countries';
import { ValueInterval } from '@/types/subIngredients/valueInterval';
import { parseReportMeta, stampReportMeta, type ReportParseResult } from './reportSchema';

/**
 * The run bridge: turns a set of provisions (from a draft reform or a
 * tracked bill) into a full society-wide report — policy → baseline +
 * reform simulations → report record — and returns the API report id
 * whose page auto-starts the calculation and renders the chart
 * dashboard. The API id is the durable one: a link carrying it opens
 * on any device, where the local association id would not.
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

/** Provenance shown in the flagship report header, stashed per report. */
export interface FlagshipReportMeta {
  title: string;
  /** e.g. "Utah · Introduced" for bills, "Hand-built draft" for drafts */
  sourceNote: string;
  provisions: RunReportProvision[];
  createdAt: string;
  /** The budget window asked for with the run, which the report opens running. */
  budgetWindow?: { startYear: number; windowSize: number };
}

const META_KEY = 'pe-flagship-report-meta';

/** Every report's provenance as stored, of any schema version (see reportSchema). */
function readAllMeta(): Record<string, unknown> {
  try {
    return JSON.parse(localStorage.getItem(META_KEY) ?? '{}');
  } catch {
    return {};
  }
}

export function saveReportMeta(userReportId: string, unstamped: FlagshipReportMeta): void {
  const meta = stampReportMeta(unstamped);
  try {
    localStorage.setItem(META_KEY, JSON.stringify({ ...readAllMeta(), [userReportId]: meta }));
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
    localStorage.setItem(META_KEY, JSON.stringify(rest));
  } catch {
    // It stays stored; the report still opens without it.
  }
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
 * Creates (or, since the API dedupes identical policies, finds) the reform
 * policy for a set of provisions — each with its dated changes, or its
 * single value from the current year onward.
 */
export async function createReformPolicy(
  countryId: CountryId,
  title: string,
  provisions: Array<Pick<RunReportProvision, 'path' | 'value' | 'intervals'>>
): Promise<number> {
  const data = Object.fromEntries(provisions.map((p) => [p.path, provisionPeriods(p)]));
  const policyResponse = await createPolicy(countryId, { data, label: title || undefined });
  return Number(policyResponse.result.policy_id);
}

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
}: RunFlagshipReportArgs): Promise<string> {
  if (provisions.length === 0) {
    throw new Error('Cannot run a report with no provisions');
  }

  const reformPolicyId = await createReformPolicy(countryId, title, provisions);

  const [baseline, reform] = await Promise.all([
    createSimulation(countryId, {
      population_id: region ?? countryId,
      population_type: 'geography',
      policy_id: currentLawId,
    }),
    createSimulation(countryId, {
      population_id: region ?? countryId,
      population_type: 'geography',
      policy_id: reformPolicyId,
    }),
  ]);

  const { metadata } = await createReportAndAssociateWithUser({
    countryId,
    userId: MOCK_USER_ID,
    label: title || undefined,
    payload: {
      simulation_1_id: Number(baseline.result.simulation_id),
      simulation_2_id: Number(reform.result.simulation_id),
      year: String(year),
    },
  });

  const reportId = String(metadata.baseReportId);
  const budgetWindow =
    windowYears && windowYears > 1 ? { startYear: year, windowSize: windowYears } : undefined;
  saveReportMeta(reportId, {
    title,
    sourceNote,
    provisions,
    createdAt: new Date().toISOString(),
    ...(budgetWindow && { budgetWindow }),
  });

  // Start the report's own calculation now, not when its page opens: the
  // first request queues the job, so a tab closed right after "Run" still
  // gets its result, waiting for the link. The page asks with the same
  // reform, baseline, region and year, so it checks on this job.
  // A failure here never fails the run: the report page asks again.
  void Promise.resolve()
    .then(() =>
      fetchSocietyWideCalculation(countryId, String(reformPolicyId), String(currentLawId), {
        region: region ?? countryId,
        time_period: String(year),
      })
    )
    .catch(() => undefined);

  // The window was asked for with the run: start it now, alongside the
  // report, rather than when the report page opens. The first request
  // submits the batch; the report's section checks on the same one.
  if (budgetWindow) {
    void fetchBudgetWindow(countryId, String(reformPolicyId), String(currentLawId), {
      region: region ?? countryId,
      ...budgetWindow,
    }).catch(() => {
      // The report's section asks again, and shows any error there.
    });
  }

  // Record the report centrally (pointer + provenance; never outputs,
  // never a user id). Best-effort: the run already succeeded, and the
  // store falls back to localStorage when the database is unconfigured.
  try {
    const { getFlagshipReportStore } = await import('@/api/flagshipReportStore');
    await getFlagshipReportStore().create({
      countryId,
      apiReportId: String(metadata.baseReportId),
      title: title || null,
      sourceNote: sourceNote || null,
      provisions,
      year: String(year),
      reformId: reformId ?? null,
    });
  } catch {
    // The report still opens via the local association.
  }

  return reportId;
}

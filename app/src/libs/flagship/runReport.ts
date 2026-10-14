import { fetchBudgetWindow } from '@/api/budgetWindow';
import { createPolicy } from '@/api/policy';
import { createReportAndAssociateWithUser } from '@/api/report';
import { createSimulation } from '@/api/simulation';
import { fetchSocietyWideCalculation } from '@/api/societyWideCalculation';
import { CURRENT_YEAR, FOREVER, MOCK_USER_ID } from '@/constants';
import { CountryId } from '@/libs/countries';
import type { Parameter } from '@/types/subIngredients/parameter';
import { ValueInterval } from '@/types/subIngredients/valueInterval';

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

const META_KEY = 'pe-flagship-report-meta';

function readAllMeta(): Record<string, FlagshipReportMeta> {
  try {
    return JSON.parse(localStorage.getItem(META_KEY) ?? '{}');
  } catch {
    return {};
  }
}

export function saveReportMeta(userReportId: string, meta: FlagshipReportMeta): void {
  try {
    localStorage.setItem(META_KEY, JSON.stringify({ ...readAllMeta(), [userReportId]: meta }));
  } catch {
    // Provenance header simply won't show if storage is unavailable.
  }
}

export function readReportMeta(userReportId: string): FlagshipReportMeta | null {
  return readAllMeta()[userReportId] ?? null;
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

/** A baseline that names a policy other than current law, or none. */
function customBaseline(
  baseline: RunReportBaseline | undefined,
  currentLawId: number
): RunReportBaseline | undefined {
  if (!baseline) {
    return undefined;
  }
  if (baseline.policyId !== undefined) {
    return baseline.policyId === currentLawId ? undefined : baseline;
  }
  return baseline.parameters && baseline.parameters.length > 0 ? baseline : undefined;
}

/** The baseline's policy id: the one given, or its parameters made into one. */
async function baselinePolicyId(
  countryId: CountryId,
  baseline: RunReportBaseline
): Promise<number> {
  if (baseline.policyId !== undefined) {
    return baseline.policyId;
  }
  return createReformPolicy(
    countryId,
    baseline.label,
    (baseline.parameters ?? []).map((parameter) => ({
      path: parameter.name,
      value: parameter.values[0]?.value,
      intervals: parameter.values,
    }))
  );
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
  baseline: requestedBaseline,
}: RunFlagshipReportArgs): Promise<string> {
  if (provisions.length === 0) {
    throw new Error('Cannot run a report with no provisions');
  }

  // Compared with current law, unless a saved reform is chosen instead.
  const comparison = customBaseline(requestedBaseline, currentLawId);
  const [reformPolicyId, baselineId] = await Promise.all([
    createReformPolicy(countryId, title, provisions),
    comparison ? baselinePolicyId(countryId, comparison) : Promise.resolve(currentLawId),
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
    ...(comparison && {
      baseline: {
        reformId: comparison.reformId ?? null,
        policyId: String(baselineId),
        label: comparison.label,
      },
    }),
  });

  // Start the report's own calculation now, not when its page opens: the
  // first request queues the job, so a tab closed right after "Run" still
  // gets its result, waiting for the link. The page asks with the same
  // reform, baseline, region and year, so it checks on this job.
  // A failure here never fails the run: the report page asks again.
  void Promise.resolve()
    .then(() =>
      fetchSocietyWideCalculation(countryId, String(reformPolicyId), String(baselineId), {
        region: region ?? countryId,
        time_period: String(year),
      })
    )
    .catch(() => undefined);

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

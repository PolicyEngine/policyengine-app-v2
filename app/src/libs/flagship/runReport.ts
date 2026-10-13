import type { FlagshipReportStore } from '@/api/flagshipReportStore';
import { createPolicy } from '@/api/policy';
import { createReport, createReportAndAssociateWithUser } from '@/api/report';
import { createSimulation } from '@/api/simulation';
import { CURRENT_YEAR, FOREVER, MOCK_USER_ID } from '@/constants';
import { CountryId } from '@/libs/countries';
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

/** Provenance shown in the flagship report header, stashed per report. */
export interface FlagshipReportMeta {
  title: string;
  /** e.g. "Utah · Introduced" for bills, "Hand-built draft" for drafts */
  sourceNote: string;
  provisions: RunReportProvision[];
  createdAt: string;
}

export const REPORT_META_KEY = 'pe-flagship-report-meta';

/**
 * Provenance from signed-in runs. It is the account's (its record carries
 * it to every device), so it is kept for this page session only, never in
 * localStorage where the next person on this browser would find it, and
 * is dropped on sign-out.
 */
const accountReportMeta = new Map<string, FlagshipReportMeta>();

function rememberAccountReportMeta(reportId: string, meta: FlagshipReportMeta): void {
  accountReportMeta.set(reportId, meta);
}

/** Drops the signed-in session's report provenance (on sign-out). */
export function forgetAccountReportMeta(): void {
  accountReportMeta.clear();
}

function readAllMeta(): Record<string, FlagshipReportMeta> {
  try {
    return JSON.parse(localStorage.getItem(REPORT_META_KEY) ?? '{}');
  } catch {
    return {};
  }
}

export function saveReportMeta(userReportId: string, meta: FlagshipReportMeta): void {
  try {
    localStorage.setItem(
      REPORT_META_KEY,
      JSON.stringify({ ...readAllMeta(), [userReportId]: meta })
    );
  } catch {
    // Provenance header simply won't show if storage is unavailable.
  }
}

export function readReportMeta(userReportId: string): FlagshipReportMeta | null {
  return accountReportMeta.get(userReportId) ?? readAllMeta()[userReportId] ?? null;
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
   * Signed in (US/UK): the account's report store and user. The run then
   * writes exactly one `/v2/user-reports` row — with the title, source
   * note, provisions and reform link — instead of the localStorage
   * association and record.
   */
  account?: { reportStore: FlagshipReportStore; userId: string } | null;
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
  account,
}: RunFlagshipReportArgs): Promise<string> {
  if (provisions.length === 0) {
    throw new Error('Cannot run a report with no provisions');
  }

  const reformPolicyId = await createReformPolicy(countryId, title, provisions);

  const [baseline, reform] = await Promise.all([
    createSimulation(countryId, {
      population_id: countryId,
      population_type: 'geography',
      policy_id: currentLawId,
    }),
    createSimulation(countryId, {
      population_id: countryId,
      population_type: 'geography',
      policy_id: reformPolicyId,
    }),
  ]);

  const payload = {
    simulation_1_id: Number(baseline.result.simulation_id),
    simulation_2_id: Number(reform.result.simulation_id),
    year: String(year),
  };

  if (account) {
    // Signed in: the account's row is the report's only association. It is
    // written right after the v1 report exists, and a failure fails the
    // run, so a report that opens is a report that was saved.
    const reportMetadata = await createReport(countryId, payload);
    const reportId = String(reportMetadata.id);
    rememberAccountReportMeta(reportId, {
      title,
      sourceNote,
      provisions,
      createdAt: new Date().toISOString(),
    });
    await account.reportStore.create({
      userId: account.userId,
      countryId,
      apiReportId: reportId,
      title: title || null,
      sourceNote: sourceNote || null,
      provisions,
      year: String(year),
      reformId: reformId ?? null,
    });
    return reportId;
  }

  const { metadata } = await createReportAndAssociateWithUser({
    countryId,
    userId: MOCK_USER_ID,
    label: title || undefined,
    payload,
  });

  const reportId = String(metadata.baseReportId);
  saveReportMeta(reportId, {
    title,
    sourceNote,
    provisions,
    createdAt: new Date().toISOString(),
  });

  // Record the report locally (pointer + provenance; never outputs).
  // Best-effort: the run already succeeded.
  try {
    const { LocalStorageFlagshipReportStore } = await import('@/api/flagshipReportStore');
    await new LocalStorageFlagshipReportStore().create({
      userId: MOCK_USER_ID,
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

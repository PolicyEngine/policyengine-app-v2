import { createPolicy } from '@/api/policy';
import { createReportAndAssociateWithUser } from '@/api/report';
import { createSimulation } from '@/api/simulation';
import { CURRENT_YEAR, FOREVER, MOCK_USER_ID } from '@/constants';
import { CountryId } from '@/libs/countries';

/**
 * The run bridge: turns a set of provisions (from a draft reform or a
 * tracked bill) into a full society-wide report — policy → baseline +
 * reform simulations → report record — and returns the userReportId
 * whose page auto-starts the calculation and renders the chart
 * dashboard.
 */
export interface RunReportProvision {
  path: string;
  breadcrumb: string;
  unit: string | null;
  baselineValue: any;
  value: any;
}

/** Provenance shown in the flagship report header, stashed per report. */
export interface FlagshipReportMeta {
  title: string;
  /** e.g. "Utah · Introduced" for bills, "Hand-built draft" for drafts */
  sourceNote: string;
  provisions: RunReportProvision[];
  createdAt: string;
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

export interface RunFlagshipReportArgs {
  countryId: CountryId;
  title: string;
  sourceNote: string;
  provisions: RunReportProvision[];
  /** Numeric current-law policy id from metadata (US 2, UK 1). */
  currentLawId: number;
}

export async function runFlagshipReport({
  countryId,
  title,
  sourceNote,
  provisions,
  currentLawId,
}: RunFlagshipReportArgs): Promise<string> {
  if (provisions.length === 0) {
    throw new Error('Cannot run a report with no provisions');
  }

  const data = Object.fromEntries(
    provisions.map((p) => [p.path, { [`${CURRENT_YEAR}-01-01.${FOREVER}`]: p.value }])
  );
  const policyResponse = await createPolicy(countryId, { data, label: title || undefined });
  const reformPolicyId = Number(policyResponse.result.policy_id);

  const baseline = await createSimulation(countryId, {
    population_id: countryId,
    population_type: 'geography',
    policy_id: currentLawId,
  });
  const reform = await createSimulation(countryId, {
    population_id: countryId,
    population_type: 'geography',
    policy_id: reformPolicyId,
  });

  const { metadata } = await createReportAndAssociateWithUser({
    countryId,
    userId: MOCK_USER_ID,
    label: title || undefined,
    payload: {
      simulation_1_id: Number(baseline.result.simulation_id),
      simulation_2_id: Number(reform.result.simulation_id),
      year: CURRENT_YEAR,
    },
  });

  saveReportMeta(metadata.userReportId, {
    title,
    sourceNote,
    provisions,
    createdAt: new Date().toISOString(),
  });
  return metadata.userReportId;
}

import {
  convertParametersToPolicyJson,
  convertScalarToValueIntervals,
} from '@/adapters/conversionHelpers';
import { createPolicy } from '@/api/policy';
import { createReportAndAssociateWithUser } from '@/api/report';
import { createSimulation } from '@/api/simulation';
import { CURRENT_YEAR, MOCK_USER_ID } from '@/constants';
import { CountryId } from '@/libs/countries';
import { ParameterMetadataCollection } from '@/types/metadata/parameterMetadata';
import { Parameter } from '@/types/subIngredients/parameter';
import { ValueInterval } from '@/types/subIngredients/valueInterval';
import { NoEffectivePolicyChangesError, normalizePolicyParameters } from '@/utils/policyCurrentLaw';
import { getParameterValueAtDate } from '@/utils/policyParameterUpdate';

/**
 * The run bridge: turns a set of provisions (from a draft reform or a
 * tracked bill) into a full society-wide report — policy → baseline +
 * reform simulations → report record — and returns the API report id
 * whose page auto-starts the calculation and renders the chart
 * dashboard. The API id is the durable one: a link carrying it opens
 * on any device, where the local association id would not.
 */
export interface RunReportProvision {
  path: Parameter['name'];
  breadcrumb: string;
  unit: string | null;
  baselineValue: unknown;
  /** Canonical PolicyEngine representation of the proposed parameter values. */
  values: Parameter['values'];
}

export interface ScalarRunReportProvision extends Omit<RunReportProvision, 'values'> {
  value: unknown;
}

/** Convert a scalar source such as a tracked bill into dated values. */
export function createRunReportProvision(
  provision: ScalarRunReportProvision,
  startDate: string = `${CURRENT_YEAR}-01-01`
): RunReportProvision {
  const { value, ...details } = provision;
  return {
    ...details,
    values: convertScalarToValueIntervals(value, startDate),
  };
}

/** Return the value shown and edited for a report year. */
export function getRunReportProvisionValue(
  provision: RunReportProvision,
  year: string = CURRENT_YEAR
): unknown {
  return getParameterValueAtDate(
    { name: provision.path, values: provision.values },
    `${year}-01-01`
  );
}

/** Provenance shown in the flagship report header, stashed per report. */
export interface FlagshipReportMeta {
  title: string;
  /** e.g. "Utah · Introduced" for bills, "Hand-built draft" for drafts */
  sourceNote: string;
  provisions: RunReportProvision[];
  createdAt: string;
}

/** Build and normalize the policy parameters used by a flagship report. */
export function getEffectiveRunReportParameters(
  provisions: RunReportProvision[],
  currentLawMetadata: ParameterMetadataCollection
): Parameter[] {
  return normalizePolicyParameters(
    provisions.map((provision) => ({
      name: provision.path,
      values: provision.values,
    })),
    currentLawMetadata
  );
}

/** Return report display metadata paired with the exact normalized intervals sent to the API. */
export function getEffectiveRunReportProvisions(
  provisions: RunReportProvision[],
  currentLawMetadata: ParameterMetadataCollection
): RunReportProvision[] {
  const provisionsByPath = new Map(provisions.map((provision) => [provision.path, provision]));
  return getEffectiveRunReportParameters(provisions, currentLawMetadata).map((parameter) => ({
    ...provisionsByPath.get(parameter.name)!,
    values: parameter.values,
  }));
}

const META_KEY = 'pe-flagship-report-meta';

function normalizeStoredProvision(provision: any, year: string = CURRENT_YEAR): RunReportProvision {
  if (Array.isArray(provision.values)) {
    return {
      path: provision.path,
      breadcrumb: provision.breadcrumb,
      unit: provision.unit ?? null,
      baselineValue: provision.baselineValue,
      values: provision.values.map((interval: ValueInterval) => ({ ...interval })),
    };
  }

  return createRunReportProvision(
    {
      path: provision.path,
      breadcrumb: provision.breadcrumb,
      unit: provision.unit ?? null,
      baselineValue: provision.baselineValue,
      value: provision.value,
    },
    `${year}-01-01`
  );
}

function readAllMeta(): Record<string, FlagshipReportMeta> {
  try {
    const stored = JSON.parse(localStorage.getItem(META_KEY) ?? '{}');
    return Object.fromEntries(
      Object.entries(stored).map(([id, metadata]) => {
        const meta = metadata as FlagshipReportMeta;
        return [
          id,
          {
            ...meta,
            provisions: (meta.provisions ?? []).map((provision) =>
              normalizeStoredProvision(provision)
            ),
          },
        ];
      })
    );
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
  currentLawMetadata: ParameterMetadataCollection;
  /** Numeric current-law policy id from metadata (US 2, UK 1). */
  currentLawId: number;
  /** Saved reform this run came from, for the central report record. */
  reformId?: string | null;
}

export async function runFlagshipReport({
  countryId,
  title,
  sourceNote,
  provisions,
  currentLawMetadata,
  currentLawId,
  reformId,
}: RunFlagshipReportArgs): Promise<string> {
  if (provisions.length === 0) {
    throw new Error('Cannot run a report with no provisions');
  }

  const effectiveProvisions = getEffectiveRunReportProvisions(provisions, currentLawMetadata);
  if (effectiveProvisions.length === 0) {
    throw new NoEffectivePolicyChangesError();
  }
  const effectiveParameters = effectiveProvisions.map((provision) => ({
    name: provision.path,
    values: provision.values,
  }));
  const data = convertParametersToPolicyJson(effectiveParameters);
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

  const reportId = String(metadata.baseReportId);
  saveReportMeta(reportId, {
    title,
    sourceNote,
    provisions: effectiveProvisions,
    createdAt: new Date().toISOString(),
  });

  // Record the report centrally (pointer + provenance; never outputs).
  // Best-effort: the run already succeeded, and the store falls back to
  // localStorage when the database is unconfigured.
  try {
    const { getFlagshipReportStore } = await import('@/api/flagshipReportStore');
    await getFlagshipReportStore().create({
      userId: MOCK_USER_ID,
      countryId,
      apiReportId: String(metadata.baseReportId),
      title: title || null,
      sourceNote: sourceNote || null,
      provisions: effectiveProvisions,
      year: CURRENT_YEAR,
      reformId: reformId ?? null,
    });
  } catch {
    // The report still opens via the local association.
  }

  return reportId;
}

import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import { NORMALIZED_BREAKDOWN } from '@/tests/fixtures/hooks/useUKLocalAreaBreakdownMocks';
import type { Report } from '@/types/ingredients/Report';
import type { Simulation } from '@/types/ingredients/Simulation';

export const V2_UK_REPORT_YEAR = '2026';
export const V2_UK_BASELINE_POLICY_ID = 'baseline-policy';
export const V2_UK_REFORM_POLICY_ID = 'reform-policy';
export const V2_UK_REGION = 'uk';

/** A v2 UK society-wide report record. */
export const V2_UK_REPORT: Report = {
  id: 'report-uk-1',
  countryId: 'uk',
  year: V2_UK_REPORT_YEAR,
  apiVersion: '1.0.0',
  simulationIds: ['baseline', 'reform'],
  status: 'complete',
  outputType: 'economy',
  output: null,
};

/** The report's baseline (simulations[0]) and reform (simulations[1]) for a region. */
export function v2UKSimulations(region: string = V2_UK_REGION): Simulation[] {
  return [
    {
      id: 'baseline',
      countryId: 'uk',
      label: 'Baseline',
      policyId: V2_UK_BASELINE_POLICY_ID,
      populationId: region,
      populationType: 'geography',
      isCreated: true,
      status: 'complete',
    },
    {
      id: 'reform',
      countryId: 'uk',
      label: 'Reform',
      policyId: V2_UK_REFORM_POLICY_ID,
      populationId: region,
      populationType: 'geography',
      isCreated: true,
      status: 'complete',
    },
  ];
}

/** The props a v2 constituency or local authority tab gets for a UK-wide report. */
export const V2_UK_LOCAL_AREA_REQUEST_PROPS = {
  reformPolicyId: V2_UK_REFORM_POLICY_ID,
  baselinePolicyId: V2_UK_BASELINE_POLICY_ID,
  region: V2_UK_REGION,
  year: V2_UK_REPORT_YEAR,
};

/** The breakdown's area maps, as the v2 charts receive them inside the output. */
export const BREAKDOWN_CONSTITUENCY_IMPACT = NORMALIZED_BREAKDOWN.constituency_impact;
export const BREAKDOWN_LOCAL_AUTHORITY_IMPACT = NORMALIZED_BREAKDOWN.local_authority_impact;

/** A national UK result whose area keys are null. */
export function withNullAreaImpacts(output: SocietyWideReportOutput): SocietyWideReportOutput {
  return {
    ...output,
    constituency_impact: null,
    local_authority_impact: null,
  } as SocietyWideReportOutput;
}

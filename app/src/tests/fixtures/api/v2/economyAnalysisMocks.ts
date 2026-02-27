import { vi } from 'vitest';
import type {
  AnalysisRegionInfo,
  DecileImpactData,
  EconomicImpactRequest,
  EconomicImpactResponse,
  EconomyCustomRequest,
  SimulationInfo,
} from '@/api/v2/economyAnalysis';
import { TEST_POLICY_IDS, TEST_REPORT_IDS } from '@/tests/fixtures/constants';

export const TEST_BASELINE_SIM_ID = 'baseline-sim-001';
export const TEST_REFORM_SIM_ID = 'reform-sim-001';

export const mockSimulationInfo = (overrides?: Partial<SimulationInfo>): SimulationInfo => ({
  id: TEST_BASELINE_SIM_ID,
  status: 'completed',
  error_message: null,
  ...overrides,
});

export const mockAnalysisRegionInfo = (
  overrides?: Partial<AnalysisRegionInfo>
): AnalysisRegionInfo => ({
  code: 'state/ca',
  label: 'California',
  region_type: 'state',
  requires_filter: true,
  filter_field: 'state_code',
  filter_value: 'CA',
  ...overrides,
});

export const mockDecileImpact = (overrides?: Partial<DecileImpactData>): DecileImpactData => ({
  id: 'di-001',
  report_id: TEST_REPORT_IDS.REPORT_JKL,
  decile: 1,
  relative_change: 0.02,
  average_change: 150.0,
  count_better_off: 1000,
  count_worse_off: 200,
  count_no_change: 300,
  ...overrides,
});

export const mockEconomicImpactRequest = (
  overrides?: Partial<EconomicImpactRequest>
): EconomicImpactRequest => ({
  tax_benefit_model_name: 'policyengine-us',
  region: 'state/ca',
  policy_id: TEST_POLICY_IDS.POLICY_789,
  ...overrides,
});

export const mockEconomicImpactResponse = (
  overrides?: Partial<EconomicImpactResponse>
): EconomicImpactResponse => ({
  report_id: TEST_REPORT_IDS.REPORT_JKL,
  status: 'completed',
  baseline_simulation: mockSimulationInfo({ id: TEST_BASELINE_SIM_ID }),
  reform_simulation: mockSimulationInfo({ id: TEST_REFORM_SIM_ID }),
  region: mockAnalysisRegionInfo(),
  error_message: null,
  decile_impacts: [mockDecileImpact()],
  program_statistics: null,
  poverty: null,
  inequality: null,
  budget_summary: null,
  intra_decile: null,
  detailed_budget: null,
  congressional_district_impact: null,
  constituency_impact: null,
  local_authority_impact: null,
  wealth_decile: null,
  intra_wealth_decile: null,
  ...overrides,
});

export const mockPendingEconomicImpactResponse = (): EconomicImpactResponse =>
  mockEconomicImpactResponse({
    status: 'pending',
    decile_impacts: null,
  });

export const mockFailedEconomicImpactResponse = (
  errorMessage = 'Economy analysis error'
): EconomicImpactResponse =>
  mockEconomicImpactResponse({
    status: 'failed',
    decile_impacts: null,
    error_message: errorMessage,
  });

export const mockEconomyCustomRequest = (
  overrides?: Partial<EconomyCustomRequest>
): EconomyCustomRequest => ({
  tax_benefit_model_name: 'policyengine-us',
  modules: ['decile_impacts', 'poverty'],
  policy_id: TEST_POLICY_IDS.POLICY_789,
  ...overrides,
});

// HTTP helpers (reuse simulationMocks pattern)
export const mockSuccessResponse = (data: any) => ({
  ok: true,
  status: 200,
  json: vi.fn().mockResolvedValue(data),
  text: vi.fn().mockResolvedValue(JSON.stringify(data)),
});

export const mockErrorResponse = (status: number, errorText = 'Server error') => ({
  ok: false,
  status,
  json: vi.fn().mockRejectedValue(new Error('Not JSON')),
  text: vi.fn().mockResolvedValue(errorText),
});

export const ECONOMY_ANALYSIS_ERROR_MESSAGES = {
  CREATE_FAILED: (status: number, text: string) =>
    `Failed to create economy analysis: ${status} ${text}`,
  GET_NOT_FOUND: (id: string) => `Economy analysis report ${id} not found`,
  GET_FAILED: (status: number, text: string) => `Failed to get economy analysis: ${status} ${text}`,
  ANALYSIS_FAILED: 'Economy analysis failed',
  ANALYSIS_TIMED_OUT: 'Economy analysis timed out',
  CREATE_CUSTOM_FAILED: (status: number, text: string) =>
    `Failed to create custom economy analysis: ${status} ${text}`,
  GET_CUSTOM_NOT_FOUND: (id: string) => `Custom economy analysis report ${id} not found`,
  GET_CUSTOM_FAILED: (status: number, text: string) =>
    `Failed to get custom economy analysis: ${status} ${text}`,
} as const;

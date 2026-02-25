import { vi } from 'vitest';
import type {
  HouseholdImpactRequest,
  HouseholdImpactResponse,
  HouseholdSimulationInfo,
} from '@/api/v2/householdAnalysis';
import { TEST_POLICY_IDS, TEST_REPORT_IDS } from '@/tests/fixtures/constants';

export const TEST_HOUSEHOLD_IDS = {
  HH_ANALYSIS_001: 'hh-analysis-001',
} as const;

export const TEST_HH_SIM_IDS = {
  BASELINE: 'hh-baseline-sim-001',
  REFORM: 'hh-reform-sim-001',
} as const;

export const mockHouseholdSimulationInfo = (
  overrides?: Partial<HouseholdSimulationInfo>
): HouseholdSimulationInfo => ({
  id: TEST_HH_SIM_IDS.BASELINE,
  status: 'completed',
  error_message: null,
  ...overrides,
});

export const mockHouseholdImpactRequest = (
  overrides?: Partial<HouseholdImpactRequest>
): HouseholdImpactRequest => ({
  household_id: TEST_HOUSEHOLD_IDS.HH_ANALYSIS_001,
  policy_id: TEST_POLICY_IDS.POLICY_789,
  ...overrides,
});

export const mockHouseholdImpactResponse = (
  overrides?: Partial<HouseholdImpactResponse>
): HouseholdImpactResponse => ({
  report_id: TEST_REPORT_IDS.REPORT_JKL,
  report_type: 'household_impact',
  status: 'completed',
  baseline_simulation: mockHouseholdSimulationInfo({ id: TEST_HH_SIM_IDS.BASELINE }),
  reform_simulation: mockHouseholdSimulationInfo({ id: TEST_HH_SIM_IDS.REFORM }),
  baseline_result: { people: { person1: { income: { 2025: 50000 } } } },
  reform_result: { people: { person1: { income: { 2025: 52000 } } } },
  impact: { people: { person1: { income: { 2025: 2000 } } } },
  error_message: null,
  ...overrides,
});

export const mockPendingHouseholdImpactResponse = (): HouseholdImpactResponse =>
  mockHouseholdImpactResponse({
    status: 'pending',
    baseline_result: null,
    reform_result: null,
    impact: null,
  });

export const mockFailedHouseholdImpactResponse = (
  errorMessage = 'Household analysis error'
): HouseholdImpactResponse =>
  mockHouseholdImpactResponse({
    status: 'failed',
    baseline_result: null,
    reform_result: null,
    impact: null,
    error_message: errorMessage,
  });

// HTTP helpers
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

export const HOUSEHOLD_ANALYSIS_ERROR_MESSAGES = {
  CREATE_FAILED: (status: number, text: string) =>
    `Failed to create household analysis: ${status} ${text}`,
  GET_NOT_FOUND: (id: string) => `Household analysis report ${id} not found`,
  GET_FAILED: (status: number, text: string) =>
    `Failed to get household analysis: ${status} ${text}`,
  ANALYSIS_FAILED: 'Household analysis failed',
  ANALYSIS_TIMED_OUT: 'Household analysis timed out',
} as const;

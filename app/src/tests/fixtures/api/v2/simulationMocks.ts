import { vi } from 'vitest';
import type {
  EconomySimulationRequest,
  EconomySimulationResponse,
  HouseholdSimulationRequest,
  HouseholdSimulationResponse,
  RegionInfo,
} from '@/api/v2/simulations';
import { TEST_COUNTRIES, TEST_POLICY_IDS, TEST_SIMULATION_IDS } from '@/tests/fixtures/constants';

// IDs
export const TEST_HOUSEHOLD_IDS = {
  HH_001: 'hh-001',
  HH_002: 'hh-002',
} as const;

export const TEST_DATASET_IDS = {
  CPS_2024: 'dataset-cps-2024',
  FRS_2024: 'dataset-frs-2024',
} as const;

export const TEST_OUTPUT_DATASET_IDS = {
  OUTPUT_001: 'output-dataset-001',
} as const;

// Mock region info
export const mockRegionInfo = (overrides?: Partial<RegionInfo>): RegionInfo => ({
  code: 'state/ca',
  name: 'California',
  dataset_id: TEST_DATASET_IDS.CPS_2024,
  filter_field: 'state_code',
  filter_value: 'CA',
  ...overrides,
});

// Mock household simulation request
export const mockHouseholdSimulationRequest = (
  overrides?: Partial<HouseholdSimulationRequest>
): HouseholdSimulationRequest => ({
  household_id: TEST_HOUSEHOLD_IDS.HH_001,
  policy_id: TEST_POLICY_IDS.POLICY_789,
  ...overrides,
});

// Mock household simulation responses by status
export const mockHouseholdSimulationResponse = (
  overrides?: Partial<HouseholdSimulationResponse>
): HouseholdSimulationResponse => ({
  id: TEST_SIMULATION_IDS.SIM_DEF,
  status: 'completed',
  household_id: TEST_HOUSEHOLD_IDS.HH_001,
  policy_id: TEST_POLICY_IDS.POLICY_789,
  household_result: { output: 'test-result' },
  error_message: null,
  ...overrides,
});

export const mockPendingHouseholdResponse = (): HouseholdSimulationResponse =>
  mockHouseholdSimulationResponse({ status: 'pending', household_result: null });

export const mockFailedHouseholdResponse = (
  errorMessage = 'Simulation calculation error'
): HouseholdSimulationResponse =>
  mockHouseholdSimulationResponse({
    status: 'failed',
    household_result: null,
    error_message: errorMessage,
  });

// Mock economy simulation request
export const mockEconomySimulationRequest = (
  overrides?: Partial<EconomySimulationRequest>
): EconomySimulationRequest => ({
  tax_benefit_model_name: 'policyengine-us',
  region: 'state/ca',
  policy_id: TEST_POLICY_IDS.POLICY_789,
  ...overrides,
});

// Mock economy simulation responses by status
export const mockEconomySimulationResponse = (
  overrides?: Partial<EconomySimulationResponse>
): EconomySimulationResponse => ({
  id: TEST_SIMULATION_IDS.SIM_GHI,
  status: 'completed',
  dataset_id: TEST_DATASET_IDS.CPS_2024,
  policy_id: TEST_POLICY_IDS.POLICY_789,
  output_dataset_id: TEST_OUTPUT_DATASET_IDS.OUTPUT_001,
  filter_field: 'state_code',
  filter_value: 'CA',
  region: mockRegionInfo(),
  error_message: null,
  ...overrides,
});

export const mockPendingEconomyResponse = (): EconomySimulationResponse =>
  mockEconomySimulationResponse({ status: 'pending', output_dataset_id: null });

export const mockFailedEconomyResponse = (
  errorMessage = 'Economy simulation error'
): EconomySimulationResponse =>
  mockEconomySimulationResponse({
    status: 'failed',
    output_dataset_id: null,
    error_message: errorMessage,
  });

// HTTP response helpers
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

export const mockNotFoundResponse = () => mockErrorResponse(404, 'Not found');

// Error messages matching implementation
export const SIMULATION_ERROR_MESSAGES = {
  CREATE_HOUSEHOLD_FAILED: (status: number, text: string) =>
    `Failed to create household simulation: ${status} ${text}`,
  GET_HOUSEHOLD_NOT_FOUND: (id: string) => `Household simulation ${id} not found`,
  GET_HOUSEHOLD_FAILED: (status: number, text: string) =>
    `Failed to get household simulation: ${status} ${text}`,
  HOUSEHOLD_FAILED: 'Household simulation failed',
  HOUSEHOLD_TIMED_OUT: 'Household simulation timed out',
  CREATE_ECONOMY_FAILED: (status: number, text: string) =>
    `Failed to create economy simulation: ${status} ${text}`,
  GET_ECONOMY_NOT_FOUND: (id: string) => `Economy simulation ${id} not found`,
  GET_ECONOMY_FAILED: (status: number, text: string) =>
    `Failed to get economy simulation: ${status} ${text}`,
  ECONOMY_FAILED: 'Economy simulation failed',
  ECONOMY_TIMED_OUT: 'Economy simulation timed out',
} as const;

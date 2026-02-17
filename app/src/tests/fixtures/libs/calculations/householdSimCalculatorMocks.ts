import { vi } from 'vitest';
import { CURRENT_YEAR } from '@/constants';
import { Household } from '@/types/ingredients/Household';

// ============================================================================
// Test IDs and constants
// ============================================================================

export const TEST_SIM_IDS = {
  SIMULATION_1: 'sim-001-uuid',
  SIMULATION_2: 'sim-002-uuid',
} as const;

export const TEST_REPORT_IDS = {
  REPORT_1: 'report-001-uuid',
} as const;

export const TEST_HOUSEHOLD_IDS = {
  HOUSEHOLD_1: 'household-001-uuid',
} as const;

export const TEST_POLICY_IDS = {
  BASELINE: 'policy-baseline-uuid',
  REFORM: 'policy-reform-uuid',
} as const;

export const TEST_COUNTRIES = {
  US: 'us',
  UK: 'uk',
} as const;

// ============================================================================
// Mock households
// ============================================================================

export const mockHouseholdInput = (): Household => ({
  id: TEST_HOUSEHOLD_IDS.HOUSEHOLD_1,
  tax_benefit_model_name: 'policyengine_us',
  year: parseInt(CURRENT_YEAR, 10),
  people: [{ age: 30, employment_income: 50000 }],
});

export const mockHouseholdResult = (): Household => ({
  id: TEST_HOUSEHOLD_IDS.HOUSEHOLD_1,
  tax_benefit_model_name: 'policyengine_us',
  year: parseInt(CURRENT_YEAR, 10),
  people: [{ age: 30, employment_income: 50000, net_income: 42000 }],
  household: { household_net_income: 42000 },
});

// ============================================================================
// Mock QueryClient
// ============================================================================

export const createMockQueryClient = () => ({
  setQueryData: vi.fn(),
  getQueryData: vi.fn(),
  invalidateQueries: vi.fn(),
});

// ============================================================================
// Default execution params
// ============================================================================

export const mockExecuteParams = (
  overrides?: Partial<{
    countryId: string;
    populationId: string;
    policyId: string;
  }>
) => ({
  countryId: TEST_COUNTRIES.US,
  populationId: TEST_HOUSEHOLD_IDS.HOUSEHOLD_1,
  policyId: TEST_POLICY_IDS.REFORM,
  ...overrides,
});

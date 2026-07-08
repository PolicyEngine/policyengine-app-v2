import type { CountryId } from '@/libs/countries';
import type { AppHouseholdInputData } from '@/models/household/appTypes';

// ============================================================================
// Test constants
// ============================================================================

export const TEST_ID = 'test-id-001' as const;
export const TEST_COUNTRY_ID: CountryId = 'us';
export const TEST_LABEL = 'My test policy';
export const TEST_API_VERSION = 'v2' as const;
export const TEST_HOUSEHOLD_ID = 'hh-id-001' as const;
export const TEST_HOUSEHOLD_LABEL = 'My test household';
export const TEST_TIMESTAMP = '2026-01-15T10:00:00Z' as const;
export const TEST_UPDATED_TIMESTAMP = '2026-01-15T12:00:00Z' as const;

export const TEST_POLICY_IDS = {
  POLICY_A: 'policy-aaa-111',
  POLICY_B: 'policy-bbb-222',
} as const;

export const TEST_HOUSEHOLD_IDS = {
  HOUSEHOLD_A: 'hh-aaa-111',
  HOUSEHOLD_B: 'hh-bbb-222',
} as const;

export const TEST_PARAMETER_NAMES = {
  INCOME_TAX_RATE: 'income_tax.rate',
  STANDARD_DEDUCTION: 'standard_deduction.amount',
  CHILD_BENEFIT: 'child_benefit.amount',
} as const;

// ============================================================================
// PolicyData factory
// ============================================================================

export interface PolicyDataShape {
  id: string;
  countryId: CountryId;
  label: string | null;
  apiVersion: string;
  isCreated: boolean;
  parameters: {
    parameterName: string;
    parameterId?: string;
    value: number | string | boolean | Record<string, unknown>;
    startDate: string;
    endDate: string | null;
  }[];
}

export const createMockPolicyData = (overrides?: Partial<PolicyDataShape>): PolicyDataShape => ({
  id: TEST_ID,
  countryId: TEST_COUNTRY_ID,
  label: TEST_LABEL,
  apiVersion: TEST_API_VERSION,
  isCreated: true,
  parameters: [
    {
      parameterName: TEST_PARAMETER_NAMES.INCOME_TAX_RATE,
      parameterId: 'param-001',
      value: 0.25,
      startDate: '2026-01-01',
      endDate: '2026-12-31',
    },
    {
      parameterName: TEST_PARAMETER_NAMES.STANDARD_DEDUCTION,
      parameterId: 'param-002',
      value: 15000,
      startDate: '2026-01-01',
      endDate: null,
    },
  ],
  ...overrides,
});

export const createMockCurrentLawPolicyData = (
  overrides?: Partial<PolicyDataShape>
): PolicyDataShape =>
  createMockPolicyData({
    label: null,
    parameters: [],
    ...overrides,
  });

// ============================================================================
// HouseholdData factory
// ============================================================================

export interface HouseholdDataShape {
  id: string;
  countryId: CountryId;
  year: number | null;
  label: string | null;
  data: AppHouseholdInputData;
}

export const createMockHouseholdData = (
  overrides?: Partial<HouseholdDataShape>
): HouseholdDataShape => ({
  id: TEST_HOUSEHOLD_ID,
  countryId: TEST_COUNTRY_ID,
  year: 2026,
  label: TEST_HOUSEHOLD_LABEL,
  data: {
    people: {
      adult: { age: { 2026: 35 }, employment_income: { 2026: 50000 } },
      child: { age: { 2026: 8 } },
    },
    taxUnits: { taxUnit1: { members: ['adult', 'child'] } },
    families: { family1: { members: ['adult', 'child'] } },
    spmUnits: { spmUnit1: { members: ['adult', 'child'] } },
    households: { household1: { members: ['adult', 'child'] } },
  },
  ...overrides,
});

export const createMockEmptyHouseholdData = (
  overrides?: Partial<HouseholdDataShape>
): HouseholdDataShape =>
  createMockHouseholdData({
    data: { people: {} },
    ...overrides,
  });

// ============================================================================
// Simulation data fixtures
// ============================================================================

export const BASELINE_SIMULATION_DATA = {
  id: 'sim-baseline-001',
  countryId: TEST_COUNTRY_ID,
  policyId: null,
  populationId: 'hh-001',
  populationType: 'household' as const,
  status: 'pending' as const,
  label: null,
  isCreated: true,
  output: undefined as unknown | undefined,
};

export const REFORM_SIMULATION_DATA = {
  ...BASELINE_SIMULATION_DATA,
  id: 'sim-reform-001',
  policyId: 'policy-001',
};

export const HOUSEHOLD_SIMULATION_DATA = {
  ...BASELINE_SIMULATION_DATA,
  id: 'sim-household-001',
  populationType: 'household' as const,
  populationId: 'hh-001',
};

export const ECONOMY_SIMULATION_DATA = {
  ...BASELINE_SIMULATION_DATA,
  id: 'sim-economy-001',
  populationType: 'geography' as const,
  populationId: 'state/ca',
};

export const PENDING_SIMULATION_DATA = {
  ...BASELINE_SIMULATION_DATA,
  id: 'sim-pending-001',
  status: 'pending' as const,
};

export const RUNNING_SIMULATION_DATA = {
  ...BASELINE_SIMULATION_DATA,
  id: 'sim-running-001',
  status: 'running' as const,
};

export const COMPLETE_SIMULATION_DATA = {
  ...BASELINE_SIMULATION_DATA,
  id: 'sim-complete-001',
  status: 'complete' as const,
  output: { net_income: 50000 },
};

export const ERROR_SIMULATION_DATA = {
  ...BASELINE_SIMULATION_DATA,
  id: 'sim-error-001',
  status: 'error' as const,
};

// ============================================================================
// Report data fixtures
// ============================================================================

export const HOUSEHOLD_REPORT_DATA = {
  id: 'report-household-001',
  countryId: TEST_COUNTRY_ID,
  year: '2026',
  simulationIds: ['sim-baseline', 'sim-reform'],
  status: 'pending' as const,
  outputType: 'household' as const,
  label: null,
  output: null,
};

export const ECONOMY_REPORT_DATA = {
  ...HOUSEHOLD_REPORT_DATA,
  id: 'report-economy-001',
  outputType: 'economy' as const,
};

export const COMPLETE_REPORT_DATA = {
  ...HOUSEHOLD_REPORT_DATA,
  id: 'report-complete-001',
  status: 'complete' as const,
  output: { some_result: true },
};

export const PENDING_REPORT_DATA = {
  ...HOUSEHOLD_REPORT_DATA,
  id: 'report-pending-001',
  status: 'pending' as const,
};

export const ERROR_REPORT_DATA = {
  ...HOUSEHOLD_REPORT_DATA,
  id: 'report-error-001',
  status: 'error' as const,
};

export const BASELINE_ONLY_REPORT_DATA = {
  ...HOUSEHOLD_REPORT_DATA,
  id: 'report-baseline-only-001',
  simulationIds: ['sim-baseline'],
};

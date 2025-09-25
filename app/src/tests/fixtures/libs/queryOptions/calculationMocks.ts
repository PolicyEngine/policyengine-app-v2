import { vi } from 'vitest';
import { CalculationStatusResponse } from '@/libs/calculations/status';
import { CalculationMeta } from '@/api/reportCalculations';

// Test IDs
export const CALCULATION_QUERY_TEST_REPORT_ID = '123';
export const CALCULATION_QUERY_TEST_COUNTRY_ID = 'us';

// Test report data
export const HOUSEHOLD_REPORT = {
  id: 123,
  country_id: 'us',
  simulation_1_id: 'sim1',
  simulation_2_id: 'sim2',
  api_version: 'v1',
  status: 'complete',
  output: null,
};

export const ECONOMY_REPORT = {
  id: 123,
  country_id: 'us',
  simulation_1_id: 'sim1',
  simulation_2_id: null,
  api_version: 'v1',
  status: 'complete',
  output: null,
};

// Test simulation data
export const HOUSEHOLD_SIM_BASELINE = {
  id: 1,
  country_id: 'us',
  population_type: 'household',
  population_id: 'household123',
  policy_id: 'policy1',
  api_version: 'v1',
};

export const HOUSEHOLD_SIM_REFORM = {
  id: 2,
  country_id: 'us',
  population_type: 'household',
  population_id: 'household123',
  policy_id: 'policy2',
  api_version: 'v1',
};

export const ECONOMY_SIM_SUBNATIONAL = {
  id: 1,
  country_id: 'us',
  population_type: 'geography',
  population_id: 'ca', // California
  policy_id: 'policy1',
  api_version: 'v1',
};

export const ECONOMY_SIM_NATIONAL = {
  id: 1,
  country_id: 'us',
  population_type: 'geography',
  population_id: 'us', // National
  policy_id: 'policy1',
  api_version: 'v1',
};

// Test metadata
export const HOUSEHOLD_META_WITH_REFORM: CalculationMeta = {
  type: 'household',
  countryId: 'us' as any,
  policyIds: {
    baseline: 'policy1',
    reform: 'policy2',
  },
  populationId: 'household123',
  region: undefined,
};

export const ECONOMY_META_SUBNATIONAL: CalculationMeta = {
  type: 'economy',
  countryId: 'us' as any,
  policyIds: {
    baseline: 'policy1',
    reform: undefined,
  },
  populationId: 'ca',
  region: 'ca',
};

export const ECONOMY_META_NATIONAL: CalculationMeta = {
  type: 'economy',
  countryId: 'us' as any,
  policyIds: {
    baseline: 'policy1',
    reform: undefined,
  },
  populationId: 'us',
  region: undefined,
};

// Test calculation results
export const HOUSEHOLD_CALCULATION_RESULT: CalculationStatusResponse = {
  status: 'ok',
  result: {
    household_id: 'household123',
    baseline_net_income: 50000,
    reform_net_income: 52000,
  },
};

export const ECONOMY_CALCULATION_RESULT: CalculationStatusResponse = {
  status: 'ok',
  result: {
    budget: {
      budgetary_impact: 1000000,
    },
  },
};

export const COMPUTING_STATUS: CalculationStatusResponse = {
  status: 'computing',
  result: null,
};

export const OK_STATUS: CalculationStatusResponse = {
  status: 'ok',
  result: {},
};

// Mock manager factory
export function createMockCalculationManager() {
  return {
    startCalculation: vi.fn().mockResolvedValue(undefined),
    fetchCalculation: vi.fn(),
  };
}

// Error messages
export const CALCULATION_QUERY_ERRORS = {
  NO_QUERY_CLIENT: 'QueryClient is required for calculation queries',
  NO_COUNTRY_ID: (reportId: string) => `Country ID required for metadata reconstruction of report ${reportId}`,
  WATERFALL_FAILED: (reportId: string, error: string) => `Failed to reconstruct metadata for report ${reportId}: ${error}`,
} as const;
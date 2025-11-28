import type { CalculationMeta } from '@/api/reportCalculations';

export const TEST_CALC_IDS = {
  REPORT_123: 'report-123',
} as const;

export const TEST_POLICY_IDS = {
  POLICY_1: 'policy-1',
  POLICY_2: 'policy-2',
} as const;

export const TEST_COUNTRIES = {
  US: 'us',
} as const;

export const TEST_POPULATION_IDS = {
  HOUSEHOLD_123: 'household-123',
  US: 'us',
} as const;

export const TEST_REGIONS = {
  ENHANCED_CPS: 'enhanced_cps',
  US: 'us',
} as const;

export const mockHouseholdMeta = (overrides?: Partial<CalculationMeta>): CalculationMeta => ({
  type: 'household',
  countryId: TEST_COUNTRIES.US,
  policyIds: {
    baseline: TEST_POLICY_IDS.POLICY_1,
    reform: TEST_POLICY_IDS.POLICY_2,
  },
  populationId: TEST_POPULATION_IDS.HOUSEHOLD_123,
  year: '2024',
  ...overrides,
});

export const mockEconomyMeta = (overrides?: Partial<CalculationMeta>): CalculationMeta => ({
  type: 'economy',
  countryId: TEST_COUNTRIES.US,
  policyIds: {
    baseline: TEST_POLICY_IDS.POLICY_1,
    reform: TEST_POLICY_IDS.POLICY_2,
  },
  populationId: TEST_POPULATION_IDS.US,
  region: TEST_REGIONS.ENHANCED_CPS,
  year: '2024',
  ...overrides,
});

export const mockHouseholdCalcResult = () => ({
  status: 'complete',
  result: { household_net_income: { 2024: 50000 } },
});

export const mockEconomyCalcResult = () => ({
  status: 'complete',
  result: {
    budget: { budgetary_impact: 1000000 },
  },
});

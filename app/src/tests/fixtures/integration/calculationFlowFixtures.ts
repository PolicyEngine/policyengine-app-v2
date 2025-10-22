import { CalcStartConfig, CalcStatus } from '@/types/calculation';

/**
 * Test constants for integration tests
 */
export const INTEGRATION_TEST_CONSTANTS = {
  CALC_IDS: {
    HOUSEHOLD_REPORT: 'test-household-report-123',
    SOCIETY_WIDE_REPORT: 'test-society-wide-report-456',
    SIMULATION_1: 'test-sim-1',
    SIMULATION_2: 'test-sim-2',
  },
  POLICY_IDS: {
    BASELINE: 'policy-baseline-1',
    REFORM: 'policy-reform-2',
  },
  HOUSEHOLD_IDS: {
    HOUSEHOLD_1: 'household-1',
    HOUSEHOLD_2: 'household-2',
  },
  GEOGRAPHY_IDS: {
    US_NATIONAL: 'us',
    UK_NATIONAL: 'uk',
    CA_CALIFORNIA: 'ca',
  },
} as const;

/**
 * Create mock household calculation config
 */
export const mockHouseholdCalcConfig = (overrides?: Partial<CalcStartConfig>): CalcStartConfig => ({
  calcId: INTEGRATION_TEST_CONSTANTS.CALC_IDS.HOUSEHOLD_REPORT,
  targetType: 'report',
  countryId: 'us',
  simulations: {
    simulation1: {
      id: INTEGRATION_TEST_CONSTANTS.CALC_IDS.SIMULATION_1,
      policyId: INTEGRATION_TEST_CONSTANTS.POLICY_IDS.BASELINE,
      populationType: 'household',
      populationId: INTEGRATION_TEST_CONSTANTS.HOUSEHOLD_IDS.HOUSEHOLD_1,
      label: 'Baseline',
      isCreated: true,
    },
    simulation2: null,
  },
  populations: {
    household1: {
      id: INTEGRATION_TEST_CONSTANTS.HOUSEHOLD_IDS.HOUSEHOLD_1,
      countryId: 'us',
      householdData: {
        people: {
          you: {
            age: { 2024: 30 },
          },
        },
        households: {
          'your household': {
            members: ['you'],
          },
        },
      } as any,
    },
    household2: null,
    geography1: null,
    geography2: null,
  },
  ...overrides,
});

/**
 * Create mock society-wide calculation config
 */
export const mockSocietyWideCalcConfig = (overrides?: Partial<CalcStartConfig>): CalcStartConfig => ({
  calcId: INTEGRATION_TEST_CONSTANTS.CALC_IDS.ECONOMY_REPORT,
  targetType: 'report',
  countryId: 'us',
  simulations: {
    simulation1: {
      id: INTEGRATION_TEST_CONSTANTS.CALC_IDS.SIMULATION_1,
      policyId: INTEGRATION_TEST_CONSTANTS.POLICY_IDS.BASELINE,
      populationType: 'geography',
      populationId: INTEGRATION_TEST_CONSTANTS.GEOGRAPHY_IDS.US_NATIONAL,
      label: 'Baseline',
      isCreated: true,
    },
    simulation2: {
      id: INTEGRATION_TEST_CONSTANTS.CALC_IDS.SIMULATION_2,
      policyId: INTEGRATION_TEST_CONSTANTS.POLICY_IDS.REFORM,
      populationType: 'geography',
      populationId: INTEGRATION_TEST_CONSTANTS.GEOGRAPHY_IDS.US_NATIONAL,
      label: 'Reform',
      isCreated: true,
    },
  },
  populations: {
    household1: null,
    household2: null,
    geography1: {
      id: 'us-us',
      countryId: 'us',
      scope: 'national',
      geographyId: INTEGRATION_TEST_CONSTANTS.GEOGRAPHY_IDS.US_NATIONAL,
      name: 'United States',
    },
    geography2: null,
  },
  ...overrides,
});

/**
 * Create mock household calculation result
 */
export const mockHouseholdCalcResult = () => ({
  people: {
    you: {
      age: { 2024: 30 },
      employment_income: { 2024: 50000 },
    },
  },
  households: {
    'your household': {
      members: ['you'],
      household_net_income: { 2024: 45000 },
    },
  },
});

/**
 * Create mock society-wide calculation result
 */
export const mockSocietyWideCalcResult = () => ({
  budget: {
    budgetary_impact: 1000000000,
    baseline_net_cost: 500000000,
    reform_net_cost: 1500000000,
  },
  earnings: {
    total_earnings: 2000000000,
    baseline_total_earnings: 2000000000,
    reform_total_earnings: 2100000000,
  },
  poverty: {
    poverty_rate: {
      baseline: 0.12,
      reform: 0.10,
    },
  },
});

/**
 * Create mock computing CalcStatus for integration tests
 */
export const mockIntegrationComputingStatus = (
  calcId: string,
  progress: number = 50
): CalcStatus => ({
  status: 'pending',
  progress,
  message: 'Computing...',
  queuePosition: 2,
  estimatedTimeRemaining: 5000,
  metadata: {
    calcId,
    calcType: 'societyWide',
    targetType: 'report',
    startedAt: Date.now(),
  },
});

/**
 * Create mock complete CalcStatus for integration tests
 */
export const mockIntegrationCompleteStatus = (
  calcId: string,
  result: any
): CalcStatus => ({
  status: 'complete',
  result,
  metadata: {
    calcId,
    calcType: 'societyWide',
    targetType: 'report',
    startedAt: Date.now() - 10000,
  },
});

/**
 * Create mock error CalcStatus for integration tests
 */
export const mockIntegrationErrorStatus = (calcId: string): CalcStatus => ({
  status: 'error',
  error: {
    message: 'Integration test calculation error',
    code: 'CALCULATION_FAILED',
    retryable: true,
  },
  metadata: {
    calcId,
    calcType: 'societyWide',
    targetType: 'report',
    startedAt: Date.now() - 5000,
  },
});

/**
 * Mock API response for society-wide calculation (computing)
 */
export const mockSocietyWideAPIComputingResponse = {
  status: 'computing',
  queue_position: 2,
  progress: 0.5,
  message: 'Computing...',
};

/**
 * Mock API response for society-wide calculation (complete)
 */
export const mockSocietyWideAPICompleteResponse = {
  status: 'ok',
  result: mockSocietyWideCalcResult(),
};

/**
 * Mock API response for household calculation
 */
export const mockHouseholdAPIResponse = mockHouseholdCalcResult();

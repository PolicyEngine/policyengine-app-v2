import { CalcError, CalcMetadata, CalcParams, CalcStatus } from '@/types/calculation';
import { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import { HouseholdData } from '@/types/ingredients/Household';

/**
 * Mock CalcError for testing
 */
export const mockCalcError = (overrides?: Partial<CalcError>): CalcError => ({
  code: 'CALC_ERROR',
  message: 'Calculation failed',
  retryable: true,
  ...overrides,
});

/**
 * Mock CalcMetadata for testing
 */
export const mockCalcMetadata = (overrides?: Partial<CalcMetadata>): CalcMetadata => ({
  calcId: 'test-calc-id',
  calcType: 'societyWide',
  targetType: 'report',
  startedAt: Date.now(),
  ...overrides,
});

/**
 * Mock CalcParams for society-wide calculation
 */
export const mockSocietyWideCalcParams = (overrides?: Partial<CalcParams>): CalcParams => ({
  countryId: 'us',
  calcType: 'societyWide',
  policyIds: {
    baseline: '1',
    reform: '2',
  },
  populationId: 'us',
  region: 'us',
  calcId: 'test-calc-id',
  ...overrides,
});

/**
 * Mock CalcParams for household calculation
 */
export const mockHouseholdCalcParams = (overrides?: Partial<CalcParams>): CalcParams => ({
  countryId: 'us',
  calcType: 'household',
  policyIds: {
    baseline: '1',
  },
  populationId: 'test-household-id',
  calcId: 'test-calc-id',
  ...overrides,
});

/**
 * Mock society-wide calculation result
 * Note: This is a minimal mock for testing - not a complete SocietyWideReportOutput
 */
export const mockSocietyWideResult = (): SocietyWideReportOutput =>
  ({
    budget: {
      baseline_net_income: 1000000,
      benefit_spending_impact: 50000,
      budgetary_impact: -25000,
      households: 1000,
      state_tax_revenue_impact: 10000,
      tax_revenue_impact: 15000,
    },
    decile: {
      average: {},
      relative: {},
    },
    poverty: {
      baseline: {},
      reform: {},
    },
    poverty_by_race: null,
    data_version: '2024.1.0',
  }) as any as SocietyWideReportOutput;

/**
 * Mock household calculation result
 */
export const mockHouseholdResult = (): HouseholdData => ({
  people: {
    person1: {
      age: { '2024': 30 },
      employment_income: { '2024': 50000 },
    },
  },
  households: {
    household1: {
      members: ['person1'],
      household_net_income: { '2024': 45000 },
    },
  },
});

/**
 * Mock CalcStatus in idle state
 */
export const mockIdleCalcStatus = (overrides?: Partial<CalcStatus>): CalcStatus => ({
  status: 'idle',
  metadata: mockCalcMetadata(),
  ...overrides,
});

/**
 * Mock CalcStatus in computing state
 */
export const mockComputingCalcStatus = (overrides?: Partial<CalcStatus>): CalcStatus => ({
  status: 'pending',
  progress: 50,
  message: 'Running policy simulation...',
  metadata: mockCalcMetadata(),
  ...overrides,
});

/**
 * Mock CalcStatus in complete state
 */
export const mockCompleteCalcStatus = (overrides?: Partial<CalcStatus>): CalcStatus => ({
  status: 'complete',
  result: mockSocietyWideResult(),
  metadata: mockCalcMetadata(),
  ...overrides,
});

/**
 * Mock CalcStatus in error state
 */
export const mockErrorCalcStatus = (overrides?: Partial<CalcStatus>): CalcStatus => ({
  status: 'error',
  error: mockCalcError(),
  metadata: mockCalcMetadata(),
  ...overrides,
});

// Aliases for consistency with test naming
export const mockCalcStatusComputing = mockComputingCalcStatus;
export const mockCalcStatusComplete = mockCompleteCalcStatus;
export const mockCalcStatusError = mockErrorCalcStatus;

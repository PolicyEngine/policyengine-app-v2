import type { EconomicImpactResponse } from '@/api/v2/economyAnalysis';
import {
  createMockBudgetSummary,
  createMockEconomicImpactResponse,
} from '@/tests/fixtures/v2MockFactory';
import { CalcError, CalcMetadata, CalcParams, CalcStatus } from '@/types/calculation';
import { Household } from '@/types/ingredients/Household';

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
  year: '2024',
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
  year: '2024',
  calcId: 'test-calc-id',
  ...overrides,
});

/**
 * Mock society-wide calculation result (v2 EconomicImpactResponse)
 */
export const mockSocietyWideResult = (): EconomicImpactResponse =>
  createMockEconomicImpactResponse({
    budget_summary: createMockBudgetSummary({
      taxRevenue: 15000,
      stateTaxRevenue: 10000,
      benefitSpending: 50000,
      countPeople: 1000,
      netIncome: 1000000,
    }),
  });

/**
 * Mock household calculation result
 */
export const mockHouseholdResult = (): Household => ({
  tax_benefit_model_name: 'policyengine_us',
  year: 2024,
  people: [{ age: 30, employment_income: 50000 }],
  household: { household_net_income: 45000 },
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
 * Mock CalcStatus in pending state (calculation actively running)
 * Note: The status value is 'pending', not 'computing'
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
export const mockCalcStatusIdle = mockIdleCalcStatus;
export const mockCalcStatusComputing = mockComputingCalcStatus;
export const mockCalcStatusComplete = mockCompleteCalcStatus;
export const mockCalcStatusError = mockErrorCalcStatus;

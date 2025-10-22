import { vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import type { CalcStartConfig, CalcStatus } from '@/types/calculation';
import { mockHouseholdResult, mockSocietyWideResult } from '@/tests/fixtures/types/calculationFixtures';

/**
 * Create a test QueryClient with retry disabled
 */
export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

/**
 * Create a mock manager for CalcOrchestrator tests
 */
export const createMockManager = () => ({
  cleanup: vi.fn(),
});

/**
 * Test constants for calculation IDs
 */
export const TEST_CALC_IDS = {
  SIM_1: 'sim-1',
  REPORT_1: 'report-1',
  REPORT_123: 'report-123',
} as const;

export const TEST_COUNTRIES = {
  US: 'us',
  UK: 'uk',
} as const;

export const TEST_POLICY_IDS = {
  POLICY_1: 'policy-1',
  POLICY_2: 'policy-2',
} as const;

export const TEST_POPULATION_IDS = {
  HOUSEHOLD_1: 'household-1',
  US: 'us',
} as const;

/**
 * Mock CalcStartConfig for household simulation
 */
export const mockHouseholdCalcConfig = (overrides?: Partial<CalcStartConfig>): CalcStartConfig => ({
  calcId: TEST_CALC_IDS.SIM_1,
  targetType: 'simulation',
  countryId: TEST_COUNTRIES.US,
  simulations: {
    simulation1: {
      policyId: TEST_POLICY_IDS.POLICY_1,
      populationType: 'household',
      populationId: TEST_POPULATION_IDS.HOUSEHOLD_1,
    },
  },
  populations: {
    household1: { id: TEST_POPULATION_IDS.HOUSEHOLD_1 },
  },
  ...overrides,
});

/**
 * Mock CalcStartConfig for household simulation with reportId
 */
export const mockHouseholdCalcConfigWithReport = (overrides?: Partial<CalcStartConfig>): CalcStartConfig => ({
  ...mockHouseholdCalcConfig(),
  reportId: TEST_CALC_IDS.REPORT_123,
  ...overrides,
});

/**
 * Mock CalcStartConfig for society-wide report
 */
export const mockSocietyWideCalcConfig = (overrides?: Partial<CalcStartConfig>): CalcStartConfig => ({
  calcId: TEST_CALC_IDS.REPORT_1,
  targetType: 'report',
  countryId: TEST_COUNTRIES.US,
  simulations: {
    simulation1: {
      policyId: TEST_POLICY_IDS.POLICY_1,
      populationType: 'geography',
      populationId: TEST_POPULATION_IDS.US,
    },
    simulation2: {
      policyId: TEST_POLICY_IDS.POLICY_2,
      populationType: 'geography',
      populationId: TEST_POPULATION_IDS.US,
    },
  },
  populations: {
    geography1: { geographyId: TEST_POPULATION_IDS.US },
  },
  ...overrides,
});

/**
 * Mock CalcStatus for complete household calculation
 */
export const mockCompleteHouseholdStatus = (overrides?: Partial<CalcStatus>): CalcStatus => ({
  status: 'complete',
  result: mockHouseholdResult(),
  metadata: {
    calcId: TEST_CALC_IDS.SIM_1,
    calcType: 'household',
    targetType: 'simulation',
    startedAt: Date.now(),
  },
  ...overrides,
});

/**
 * Mock CalcStatus for pending society-wide calculation
 */
export const mockPendingSocietyWideStatus = (overrides?: Partial<CalcStatus>): CalcStatus => ({
  status: 'pending',
  progress: 0,
  metadata: {
    calcId: TEST_CALC_IDS.REPORT_1,
    calcType: 'societyWide',
    targetType: 'report',
    startedAt: Date.now(),
  },
  ...overrides,
});

/**
 * Mock CalcStatus for pending society-wide calculation with message
 */
export const mockPendingSocietyWideStatusWithMessage = (overrides?: Partial<CalcStatus>): CalcStatus => ({
  ...mockPendingSocietyWideStatus(),
  message: 'Initializing...',
  ...overrides,
});

/**
 * Mock query key for calculation
 */
export const mockCalculationQueryKey = (calcId: string) => ['calculation', calcId];

/**
 * Mock query options with polling disabled (household)
 */
export const mockHouseholdQueryOptions = (calcId: string, queryFn: any) => ({
  queryKey: mockCalculationQueryKey(calcId),
  queryFn,
  refetchInterval: false as const,
});

/**
 * Mock query options with polling enabled (society-wide)
 */
export const mockSocietyWideQueryOptions = (calcId: string, queryFn: any) => ({
  queryKey: mockCalculationQueryKey(calcId),
  queryFn,
  refetchInterval: 2000,
});

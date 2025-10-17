import { vi } from 'vitest';
import type { QueryClient } from '@tanstack/react-query';
import type { CalcStartConfig } from '@/types/calculation';
import type { Simulation } from '@/types/ingredients/Simulation';
import type { Household } from '@/types/ingredients/Household';
import type { Geography } from '@/types/ingredients/Geography';

/**
 * Test constants for orchestration components
 */
export const ORCHESTRATION_TEST_CONSTANTS = {
  RETRY_DELAY_MS: 1000,
  TEST_REPORT_ID: 'report-123',
  TEST_SIMULATION_ID: 'sim-456',
  TEST_COUNTRY_ID: 'us',
  TEST_POLICY_ID_1: 'policy-1',
  TEST_POLICY_ID_2: 'policy-2',
  TEST_HOUSEHOLD_ID: 'household-123',
  TEST_GEOGRAPHY_ID: 'california',
} as const;

/**
 * Mock Simulation
 */
export const mockSimulation = (overrides?: Partial<Simulation>): Simulation => ({
  id: 'sim-1',
  countryId: 'us',
  apiVersion: '1.0.0',
  policyId: ORCHESTRATION_TEST_CONSTANTS.TEST_POLICY_ID_1,
  populationId: ORCHESTRATION_TEST_CONSTANTS.TEST_HOUSEHOLD_ID,
  populationType: 'household',
  label: 'Test Simulation',
  isCreated: true,
  ...overrides,
});

/**
 * Mock Household
 */
export const mockHousehold = (overrides?: Partial<Household>): Household => ({
  id: ORCHESTRATION_TEST_CONSTANTS.TEST_HOUSEHOLD_ID,
  countryId: 'us',
  householdData: {
    people: {},
    households: {},
  },
  ...overrides,
});

/**
 * Mock Geography
 */
export const mockGeography = (overrides?: Partial<Geography>): Geography => ({
  id: 'us-california',
  countryId: 'us',
  scope: 'subnational',
  geographyId: ORCHESTRATION_TEST_CONSTANTS.TEST_GEOGRAPHY_ID,
  name: 'California',
  ...overrides,
});

/**
 * Mock CalcStartConfig for report
 */
export const mockReportCalcStartConfig = (
  overrides?: Partial<CalcStartConfig>
): CalcStartConfig => ({
  calcId: ORCHESTRATION_TEST_CONSTANTS.TEST_REPORT_ID,
  targetType: 'report',
  simulations: {
    simulation1: mockSimulation(),
    simulation2: mockSimulation({
      id: 'sim-2',
      policyId: ORCHESTRATION_TEST_CONSTANTS.TEST_POLICY_ID_2,
    }),
  },
  populations: {
    household1: mockHousehold(),
    household2: null,
    geography1: null,
    geography2: null,
  },
  countryId: ORCHESTRATION_TEST_CONSTANTS.TEST_COUNTRY_ID,
  ...overrides,
});

/**
 * Mock CalcStartConfig for simulation
 */
export const mockSimulationCalcStartConfig = (
  overrides?: Partial<CalcStartConfig>
): CalcStartConfig => ({
  calcId: ORCHESTRATION_TEST_CONSTANTS.TEST_SIMULATION_ID,
  targetType: 'simulation',
  simulations: {
    simulation1: mockSimulation({
      populationType: 'geography',
      populationId: ORCHESTRATION_TEST_CONSTANTS.TEST_GEOGRAPHY_ID,
    }),
    simulation2: null,
  },
  populations: {
    household1: null,
    household2: null,
    geography1: mockGeography(),
    geography2: null,
  },
  countryId: ORCHESTRATION_TEST_CONSTANTS.TEST_COUNTRY_ID,
  ...overrides,
});

/**
 * Create mock QueryClient
 */
export const createMockQueryClient = (): QueryClient => {
  return {
    prefetchQuery: vi.fn(),
    invalidateQueries: vi.fn(),
    getQueryData: vi.fn(),
    setQueryData: vi.fn(),
    getQueryState: vi.fn(),
    defaultQueryOptions: vi.fn().mockReturnValue({}),
    getQueryCache: vi.fn().mockReturnValue({
      find: vi.fn(),
      findAll: vi.fn(),
      getAll: vi.fn().mockReturnValue([]),
    }),
    getMutationCache: vi.fn().mockReturnValue({
      find: vi.fn(),
      findAll: vi.fn(),
    }),
  } as any;
};

/**
 * Create mock ResultPersister
 */
export const createMockResultPersister = () => ({
  persist: vi.fn().mockResolvedValue(undefined),
});

import type { EconomicImpactResponse } from '@/api/v2/economyAnalysis';
import { CURRENT_YEAR } from '@/constants';
import {
  createMockBudgetSummary,
  createMockEconomicImpactResponse,
} from '@/tests/fixtures/v2MockFactory';

// Test constants
export const TEST_REPORT_ID_1 = '123';
export const TEST_REPORT_ID_2 = '456';
export const TEST_SIMULATION_ID_1 = '1';
export const TEST_SIMULATION_ID_2 = '2';
export const TEST_SIMULATION_ID_3 = '3';
export const TEST_TIMESTAMP_CREATED = `${CURRENT_YEAR}-01-15T10:00:00.000Z`;
export const TEST_TIMESTAMP_UPDATED = `${CURRENT_YEAR}-01-15T10:30:00.000Z`;

// Create a minimal valid v2 economy report output
export const MOCK_REPORT_OUTPUT: EconomicImpactResponse = createMockEconomicImpactResponse({
  budget_summary: createMockBudgetSummary({
    taxRevenue: 100000,
    stateTaxRevenue: 25000,
    benefitSpending: -50000,
    countPeople: 130000000,
    netIncome: 2500000,
  }),
});

export const MOCK_REPORT_OUTPUT_ALTERNATIVE: EconomicImpactResponse =
  createMockEconomicImpactResponse({
    budget_summary: createMockBudgetSummary({
      taxRevenue: 60000,
      stateTaxRevenue: 15000,
      benefitSpending: -25000,
      countPeople: 130000000,
      netIncome: 1000000,
    }),
  });

// Initial state
export const EXPECTED_INITIAL_STATE = {
  id: '',
  label: null,
  countryId: 'us' as 'us' | 'uk' | 'ca' | 'ng' | 'il',
  year: expect.any(String),
  apiVersion: null,
  simulationIds: [],
  status: 'pending' as const,
  output: null,
  createdAt: expect.any(String),
  updatedAt: expect.any(String),
  activeSimulationPosition: 0 as 0 | 1,
  mode: 'standalone' as 'standalone' | 'report',
};

// Mock states for different scenarios
export const MOCK_EMPTY_REPORT = {
  id: '',
  label: null,
  countryId: 'us' as 'us' | 'uk' | 'ca' | 'ng' | 'il',
  year: '2024',
  apiVersion: null,
  simulationIds: [],
  status: 'pending' as const,
  output: null,
  createdAt: TEST_TIMESTAMP_CREATED,
  updatedAt: TEST_TIMESTAMP_CREATED,
  activeSimulationPosition: 0 as 0 | 1,
  mode: 'standalone' as 'standalone' | 'report',
};

export const MOCK_PENDING_REPORT = {
  id: TEST_REPORT_ID_1,
  label: null,
  countryId: 'us' as 'us' | 'uk' | 'ca' | 'ng' | 'il',
  year: '2024',
  apiVersion: 'v1',
  simulationIds: [TEST_SIMULATION_ID_1],
  status: 'pending' as const,
  output: null,
  createdAt: TEST_TIMESTAMP_CREATED,
  updatedAt: TEST_TIMESTAMP_CREATED,
  activeSimulationPosition: 0 as 0 | 1,
  mode: 'standalone' as 'standalone' | 'report',
};

export const MOCK_COMPLETE_REPORT = {
  id: TEST_REPORT_ID_1,
  label: 'Test Report',
  countryId: 'us' as 'us' | 'uk' | 'ca' | 'ng' | 'il',
  year: '2024',
  apiVersion: 'v1',
  simulationIds: [TEST_SIMULATION_ID_1, TEST_SIMULATION_ID_2],
  status: 'complete' as const,
  output: MOCK_REPORT_OUTPUT,
  createdAt: TEST_TIMESTAMP_CREATED,
  updatedAt: TEST_TIMESTAMP_UPDATED,
  activeSimulationPosition: 0 as 0 | 1,
  mode: 'standalone' as 'standalone' | 'report',
};

export const MOCK_ERROR_REPORT = {
  id: TEST_REPORT_ID_2,
  label: null,
  countryId: 'uk' as 'us' | 'uk' | 'ca' | 'ng' | 'il',
  year: '2024',
  apiVersion: 'v2',
  simulationIds: [TEST_SIMULATION_ID_1, TEST_SIMULATION_ID_2, TEST_SIMULATION_ID_3],
  status: 'error' as const,
  output: null,
  createdAt: TEST_TIMESTAMP_CREATED,
  updatedAt: TEST_TIMESTAMP_UPDATED,
  activeSimulationPosition: 0 as 0 | 1,
  mode: 'standalone' as 'standalone' | 'report',
};

// Helper functions for creating test states
export const createMockReportState = (overrides?: Partial<any>) => ({
  id: TEST_REPORT_ID_1,
  label: null,
  countryId: 'us' as 'us' | 'uk' | 'ca' | 'ng' | 'il',
  year: '2024',
  apiVersion: 'v1',
  simulationIds: [TEST_SIMULATION_ID_1],
  status: 'pending' as const,
  output: null,
  createdAt: TEST_TIMESTAMP_CREATED,
  updatedAt: TEST_TIMESTAMP_CREATED,
  activeSimulationPosition: 0 as 0 | 1,
  mode: 'standalone' as 'standalone' | 'report',
  ...overrides,
});

// Assertion helpers
export const expectReportId = (state: any, expectedId: string) => {
  expect(state.id).toBe(expectedId);
};

export const expectSimulationIds = (state: any, expectedIds: string[]) => {
  expect(state.simulationIds).toEqual(expectedIds);
};

export const expectStatus = (state: any, expectedStatus: 'pending' | 'complete' | 'error') => {
  expect(state.status).toBe(expectedStatus);
};

export const expectOutput = (state: any, expectedOutput: EconomicImpactResponse | null) => {
  expect(state.output).toEqual(expectedOutput);
};

export const expectTimestampsUpdated = (state: any, previousState: any) => {
  expect(state.createdAt).toBe(previousState.createdAt);
  expect(state.updatedAt).not.toBe(previousState.updatedAt);
};

export const expectStateToEqual = (state: any, expectedState: any) => {
  expect(state).toEqual(expectedState);
};

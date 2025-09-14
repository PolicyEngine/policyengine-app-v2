import { Report, ReportOutput } from '@/types/ingredients/Report';

// Test constants
export const TEST_REPORT_ID_1 = 'report-test-123';
export const TEST_REPORT_ID_2 = 'report-test-456';
export const TEST_SIMULATION_ID_1 = 'sim-test-001';
export const TEST_SIMULATION_ID_2 = 'sim-test-002';
export const TEST_SIMULATION_ID_3 = 'sim-test-003';
export const TEST_TIMESTAMP_CREATED = '2024-01-15T10:00:00.000Z';
export const TEST_TIMESTAMP_UPDATED = '2024-01-15T10:30:00.000Z';

// Mock report output
export const MOCK_REPORT_OUTPUT: ReportOutput = {
  total_impact: 2500000,
  households_affected: 35000,
  average_benefit: 71.43,
  distribution: {
    income_decile_1: 120,
    income_decile_2: 110,
    income_decile_3: 100,
    income_decile_4: 90,
    income_decile_5: 80,
  },
};

export const MOCK_REPORT_OUTPUT_ALTERNATIVE: ReportOutput = {
  total_impact: 1000000,
  households_affected: 15000,
  average_benefit: 66.67,
  distribution: {
    income_decile_1: 150,
    income_decile_2: 130,
  },
};

// Initial state
export const EXPECTED_INITIAL_STATE: Report = {
  reportId: '',
  simulationIds: [],
  status: 'pending',
  output: null,
  createdAt: expect.any(String),
  updatedAt: expect.any(String),
};

// Mock states for different scenarios
export const MOCK_EMPTY_REPORT: Report = {
  reportId: '',
  simulationIds: [],
  status: 'pending',
  output: null,
  createdAt: TEST_TIMESTAMP_CREATED,
  updatedAt: TEST_TIMESTAMP_CREATED,
};

export const MOCK_PENDING_REPORT: Report = {
  reportId: TEST_REPORT_ID_1,
  simulationIds: [TEST_SIMULATION_ID_1],
  status: 'pending',
  output: null,
  createdAt: TEST_TIMESTAMP_CREATED,
  updatedAt: TEST_TIMESTAMP_CREATED,
};

export const MOCK_COMPLETE_REPORT: Report = {
  reportId: TEST_REPORT_ID_1,
  simulationIds: [TEST_SIMULATION_ID_1, TEST_SIMULATION_ID_2],
  status: 'complete',
  output: MOCK_REPORT_OUTPUT,
  createdAt: TEST_TIMESTAMP_CREATED,
  updatedAt: TEST_TIMESTAMP_UPDATED,
};

export const MOCK_ERROR_REPORT: Report = {
  reportId: TEST_REPORT_ID_2,
  simulationIds: [TEST_SIMULATION_ID_1, TEST_SIMULATION_ID_2, TEST_SIMULATION_ID_3],
  status: 'error',
  output: null,
  createdAt: TEST_TIMESTAMP_CREATED,
  updatedAt: TEST_TIMESTAMP_UPDATED,
};

// Helper functions for creating test states
export const createMockReportState = (overrides?: Partial<Report>): Report => ({
  reportId: TEST_REPORT_ID_1,
  simulationIds: [TEST_SIMULATION_ID_1],
  status: 'pending',
  output: null,
  createdAt: TEST_TIMESTAMP_CREATED,
  updatedAt: TEST_TIMESTAMP_CREATED,
  ...overrides,
});

// Assertion helpers
export const expectReportId = (state: Report, expectedId: string) => {
  expect(state.reportId).toBe(expectedId);
};

export const expectSimulationIds = (state: Report, expectedIds: string[]) => {
  expect(state.simulationIds).toEqual(expectedIds);
};

export const expectStatus = (state: Report, expectedStatus: 'pending' | 'complete' | 'error') => {
  expect(state.status).toBe(expectedStatus);
};

export const expectOutput = (state: Report, expectedOutput: ReportOutput | null) => {
  expect(state.output).toEqual(expectedOutput);
};

export const expectTimestampsUpdated = (state: Report, previousState: Report) => {
  expect(state.createdAt).toBe(previousState.createdAt);
  expect(state.updatedAt).not.toBe(previousState.updatedAt);
};

export const expectStateToEqual = (state: Report, expectedState: Report) => {
  expect(state).toEqual(expectedState);
};

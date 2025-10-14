import { CURRENT_YEAR, MOCK_USER_ID } from '@/constants';
import { mockErrorReport, mockPendingReport, mockReport } from '../adapters/reportMocks';
import {
  mockSimulation1,
  mockSimulation2,
  mockUserPolicies,
  mockUserSimulations,
} from '../hooks/useUserReportsMocks';

// Mock simulations with different population types
export const mockHouseholdSimulation = {
  ...mockSimulation1,
  populationType: 'household' as const,
  populationId: 'household-123',
};

export const mockGeographySimulation = {
  ...mockSimulation2,
  populationType: 'geography' as const,
  populationId: 'us',
};

export const mockSimulationWithoutPopulationType = {
  ...mockSimulation1,
  populationType: undefined,
  populationId: 'us',
};

// Mock report data for tests
export const mockReportData = [
  {
    userReport: {
      id: 'report-1',
      userId: MOCK_USER_ID,
      reportId: '123',
      label: 'Test Report 1',
      createdAt: `${CURRENT_YEAR}-01-15T10:30:00Z`,
    },
    report: mockReport,
    simulations: [mockSimulation1, mockSimulation2],
    userSimulations: mockUserSimulations,
    userPolicies: mockUserPolicies,
    policies: [],
    households: [],
    geographies: [],
    userHouseholds: [],
    isLoading: false,
    error: null,
  },
  {
    userReport: {
      id: 'report-2',
      userId: MOCK_USER_ID,
      reportId: '1',
      label: 'Test Report 2',
      createdAt: `${CURRENT_YEAR}-01-15T11:00:00Z`,
    },
    report: mockPendingReport,
    simulations: [],
    userSimulations: [],
    userPolicies: [],
    policies: [],
    households: [],
    geographies: [],
    userHouseholds: [],
    isLoading: false,
    error: null,
  },
];

// Mock report data with mixed statuses
export const mockMixedStatusReportData = [
  {
    ...mockReportData[0],
    report: { ...mockReport, status: 'complete' as const },
  },
  {
    ...mockReportData[1],
    report: { ...mockPendingReport, status: 'pending' as const },
  },
  {
    userReport: {
      id: 'report-3',
      userId: MOCK_USER_ID,
      reportId: '2',
      label: 'Test Report 3',
      createdAt: `${CURRENT_YEAR}-01-15T11:30:00Z`,
    },
    report: { ...mockErrorReport, status: 'error' as const },
    simulations: [],
    userSimulations: [],
    userPolicies: [],
    policies: [],
    households: [],
    geographies: [],
    userHouseholds: [],
    isLoading: false,
    error: null,
  },
];

// Hook return values
export const mockDefaultHookReturn = {
  data: mockReportData,
  isLoading: false,
  isError: false,
  error: null,
};

export const mockLoadingHookReturn = {
  data: [],
  isLoading: true,
  isError: false,
  error: null,
};

export const mockErrorHookReturn = {
  data: [],
  isLoading: false,
  isError: true,
  error: new Error('Failed to fetch reports'),
};

export const mockEmptyHookReturn = {
  data: [],
  isLoading: false,
  isError: false,
  error: null,
};

export const mockMixedStatusHookReturn = {
  data: mockMixedStatusReportData,
  isLoading: false,
  isError: false,
  error: null,
};

// Mock report data for testing report type detection
export const mockHouseholdReportData = [
  {
    userReport: {
      id: 'household-report-1',
      userId: MOCK_USER_ID,
      reportId: '456',
      label: 'Household Report',
      createdAt: `${CURRENT_YEAR}-01-15T10:30:00Z`,
    },
    report: mockReport, // Has output
    simulations: [mockHouseholdSimulation],
    userSimulations: mockUserSimulations,
    userPolicies: mockUserPolicies,
    policies: [],
    households: [],
    geographies: [],
    userHouseholds: [],
    isLoading: false,
    error: null,
  },
];

export const mockGeographyReportData = [
  {
    userReport: {
      id: 'geography-report-1',
      userId: MOCK_USER_ID,
      reportId: '789',
      label: 'Geography Report',
      createdAt: `${CURRENT_YEAR}-01-15T10:30:00Z`,
    },
    report: mockReport, // Has output
    simulations: [mockGeographySimulation],
    userSimulations: mockUserSimulations,
    userPolicies: mockUserPolicies,
    policies: [],
    households: [],
    geographies: [],
    userHouseholds: [],
    isLoading: false,
    error: null,
  },
];

export const mockReportWithoutPopulationTypeData = [
  {
    userReport: {
      id: 'unknown-report-1',
      userId: MOCK_USER_ID,
      reportId: '999',
      label: 'Unknown Type Report',
      createdAt: `${CURRENT_YEAR}-01-15T10:30:00Z`,
    },
    report: mockReport, // Has output
    simulations: [mockSimulationWithoutPopulationType],
    userSimulations: mockUserSimulations,
    userPolicies: mockUserPolicies,
    policies: [],
    households: [],
    geographies: [],
    userHouseholds: [],
    isLoading: false,
    error: null,
  },
];

export const mockHouseholdReportHookReturn = {
  data: mockHouseholdReportData,
  isLoading: false,
  isError: false,
  error: null,
};

export const mockGeographyReportHookReturn = {
  data: mockGeographyReportData,
  isLoading: false,
  isError: false,
  error: null,
};

export const mockReportWithoutPopulationTypeHookReturn = {
  data: mockReportWithoutPopulationTypeData,
  isLoading: false,
  isError: false,
  error: null,
};

// Error messages
export const ERROR_MESSAGES = {
  FETCH_FAILED: 'Failed to fetch reports',
} as const;

// Mock factories for tests
// Note: These are factory functions that return mocked implementations
// They cannot be called directly in vi.mock() due to Vitest hoisting restrictions
export const createMockDispatch = () => vi.fn();
export const createMockNavigate = () => vi.fn();

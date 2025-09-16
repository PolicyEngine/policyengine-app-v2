import { MOCK_USER_ID } from '@/constants';
import { mockErrorReport, mockPendingReport, mockReport } from '../adapters/reportMocks';
import {
  mockSimulation1,
  mockSimulation2,
  mockUserPolicies,
  mockUserSimulations,
} from '../hooks/useUserReportsMocks';

// Mock report data for tests
export const mockReportData = [
  {
    userReport: {
      id: 'report-1',
      userId: MOCK_USER_ID,
      reportId: '123',
      label: 'Test Report 1',
      createdAt: '2024-01-15T10:30:00Z',
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
      createdAt: '2024-01-15T11:00:00Z',
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
      createdAt: '2024-01-15T11:30:00Z',
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

// Error messages
export const ERROR_MESSAGES = {
  FETCH_FAILED: 'Failed to fetch reports',
} as const;

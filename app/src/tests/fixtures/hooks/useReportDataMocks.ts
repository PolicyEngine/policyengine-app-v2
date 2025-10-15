import { MOCK_USER_ID } from '@/constants';

/**
 * Mock data for useReportData hook tests
 */

// Mock UserReport
export const mockUserReport = {
  id: 'user-report-123',
  userId: MOCK_USER_ID.toString(),
  reportId: 'base-report-456',
  label: 'Test Report',
  createdAt: '2025-01-15T10:00:00Z',
};

// Mock normalized report
export const mockNormalizedReport = {
  report: {
    id: 'base-report-456',
    label: 'Test Report',
    countryId: 'us',
  },
  simulations: {
    simulation1: { id: 'sim-1' },
    simulation2: { id: 'sim-2' },
  },
};

// Mock economy output
export const mockEconomyOutput = {
  budget: {
    budgetary_impact: -20200000000,
    households: 130000000,
  },
  poverty: {
    poverty: {
      all: { baseline: 0.124, reform: 0.118 },
    },
  },
};

// Mock household data
export const mockHouseholdData = {
  earnings: { 2025: 50000 },
  household_net_income: { 2025: 45000 },
};

// Mock calculation metadata
export const mockEconomyMetadata = {
  type: 'economy' as const,
  countryId: 'us' as const,
};

export const mockHouseholdMetadata = {
  type: 'household' as const,
  countryId: 'us' as const,
};

export const mockHouseholdMetadataUK = {
  type: 'household' as const,
  countryId: 'uk' as const,
};

// Mock return values for hooks
export const mockUserReportByIdSuccess = {
  data: mockUserReport,
  isLoading: false,
  error: null,
};

export const mockUserReportByIdLoading = {
  data: null,
  isLoading: true,
  error: null,
};

export const mockUserReportByIdNotFound = {
  data: null,
  isLoading: false,
  error: new Error('UserReport not found'),
};

export const mockReportOutputSuccess = {
  status: 'complete' as const,
  data: mockEconomyOutput,
  error: null,
};

export const mockReportOutputPending = {
  status: 'pending' as const,
  data: null,
  error: null,
  progress: 75,
  message: 'Calculating...',
  queuePosition: 2,
  estimatedTimeRemaining: 120,
};

export const mockReportOutputError = {
  status: 'error' as const,
  data: null,
  error: new Error('Calculation failed'),
};

export const mockReportOutputHousehold = {
  status: 'complete' as const,
  data: null, // Household reports have null output (data is in simulations)
  error: null,
};

// Base report ID constant
export const BASE_REPORT_ID = 'base-report-456';
export const USER_REPORT_ID = 'user-report-123';

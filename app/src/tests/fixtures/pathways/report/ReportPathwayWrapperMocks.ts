import { vi } from 'vitest';
import { ReportViewMode } from '@/types/pathwayModes/ReportViewMode';

// Test constants
export const TEST_COUNTRY_ID = 'us';
export const TEST_INVALID_COUNTRY_ID = 'invalid';
export const TEST_USER_ID = 'test-user-123';
export const TEST_CURRENT_LAW_ID = 1;

// Mock navigation
export const mockNavigate = vi.fn();
export const mockOnComplete = vi.fn();

// Mock hook return values
export const mockUseParams = {
  countryId: TEST_COUNTRY_ID,
};

export const mockUseParamsInvalid = {
  countryId: TEST_INVALID_COUNTRY_ID,
};

export const mockUseParamsMissing = {};

export const mockMetadata = {
  currentLawId: TEST_CURRENT_LAW_ID,
  economyOptions: {
    region: [],
  },
};

export const mockUseCreateReport = {
  createReport: vi.fn(),
  isPending: false,
  isError: false,
  error: null,
} as any;

export const mockUseUserSimulations = {
  data: [],
  isLoading: false,
  isError: false,
  error: null,
} as any;

export const mockUseUserPolicies = {
  data: [],
  isLoading: false,
  isError: false,
  error: null,
} as any;

export const mockUseUserHouseholds = {
  data: [],
  isLoading: false,
  isError: false,
  error: null,
} as any;

export const mockUseUserGeographics = {
  data: [],
  isLoading: false,
  isError: false,
  error: null,
} as any;

// Helper to reset all mocks
export const resetAllMocks = () => {
  mockNavigate.mockClear();
  mockOnComplete.mockClear();
  mockUseCreateReport.createReport.mockClear();
};

// Expected view modes
export const REPORT_VIEW_MODES = {
  LABEL: ReportViewMode.REPORT_LABEL,
  SETUP: ReportViewMode.REPORT_SETUP,
  SIMULATION_SELECTION: ReportViewMode.REPORT_SELECT_SIMULATION,
  SIMULATION_EXISTING: ReportViewMode.REPORT_SELECT_EXISTING_SIMULATION,
  SUBMIT: ReportViewMode.REPORT_SUBMIT,
} as const;

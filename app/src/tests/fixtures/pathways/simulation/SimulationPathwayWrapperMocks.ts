import { vi } from 'vitest';

// Test constants
export const TEST_COUNTRY_ID = 'us';
export const TEST_USER_ID = 'test-user-123';
export const TEST_CURRENT_LAW_ID = 1;

// Mock navigation
export const mockNavigate = vi.fn();
export const mockOnComplete = vi.fn();

// Mock hook return values
export const mockUseParams = {
  countryId: TEST_COUNTRY_ID,
};

export const mockMetadata = {
  currentLawId: TEST_CURRENT_LAW_ID,
  economyOptions: {
    region: [],
  },
};

export const mockUseCreateSimulation = {
  createSimulation: vi.fn(),
  isPending: false,
} as any;

export const mockUseUserPolicies = {
  data: [],
  isLoading: false,
} as any;

export const mockUseUserHouseholds = {
  data: [],
  isLoading: false,
} as any;

export const mockUseUserGeographics = {
  data: [],
  isLoading: false,
} as any;

// Helper to reset all mocks
export const resetAllMocks = () => {
  mockNavigate.mockClear();
  mockOnComplete.mockClear();
  mockUseCreateSimulation.createSimulation.mockClear();
};

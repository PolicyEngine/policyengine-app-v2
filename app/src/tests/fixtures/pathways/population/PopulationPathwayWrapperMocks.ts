import { vi } from 'vitest';

// Test constants
export const TEST_COUNTRY_ID = 'us';

export const mockUseParams = { countryId: TEST_COUNTRY_ID };

// Mock callbacks
export const mockNavigate = vi.fn();
export const mockNavigateToMode = vi.fn();
export const mockGoBack = vi.fn();

// Mock hook return values
export const mockUsePathwayNavigationReturn = {
  currentMode: 'LABEL',
  navigateToMode: mockNavigateToMode,
  goBack: mockGoBack,
  canGoBack: false,
};

export const mockUseRegionsEmpty = {
  regions: [],
  isLoading: false,
  error: null,
  rawRegions: [],
};

export function resetAllMocks() {
  mockNavigate.mockClear();
  mockNavigateToMode.mockClear();
  mockGoBack.mockClear();
}

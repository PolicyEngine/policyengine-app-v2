/**
 * Mock data and fixtures for CongressionalDistrictDataContext tests
 */

import type {
  StateDistrictData,
  FetchState,
  FetchAction,
  CongressionalDistrictDataContextValue,
} from '@/contexts/congressional-district/types';

// ============================================================================
// Test Constants
// ============================================================================

export const TEST_STATE_CODES = {
  ALABAMA: 'state/al',
  CALIFORNIA: 'state/ca',
  DC: 'state/dc',
  NEW_YORK: 'state/ny',
  TEXAS: 'state/tx',
} as const;

export const TEST_STRIPPED_STATE_CODES = {
  ALABAMA: 'al',
  CALIFORNIA: 'ca',
  DC: 'dc',
  NEW_YORK: 'ny',
  TEXAS: 'tx',
} as const;

export const TEST_REGION_FORMATS = {
  STATE_CA: 'state/ca',
  STATE_DC: 'state/dc',
  STATE_UPPERCASE: 'STATE/CA',
  LEGACY_CA: 'ca',
  NATIONAL: 'us',
  CONGRESSIONAL_DISTRICT: 'congressional_district/CA-01',
} as const;

export const TEST_POLICY_IDS = {
  REFORM: 'reform-policy-123',
  BASELINE: 'baseline-policy-456',
} as const;

export const TEST_YEAR = '2024';

// ============================================================================
// Mock State District Data
// ============================================================================

/**
 * Create mock state district data
 */
export function createMockStateDistrictData(
  stateCode: string,
  districtCount: number = 2
): StateDistrictData {
  const districts = Array.from({ length: districtCount }, (_, i) => {
    const districtNum = String(i + 1).padStart(2, '0');
    const stateAbbr = stateCode.replace('state/', '').toUpperCase();
    return {
      district: `${stateAbbr}-${districtNum}`,
      average_household_income_change: Math.random() * 1000 - 500,
      relative_household_income_change: Math.random() * 0.1 - 0.05,
    };
  });

  return {
    stateCode,
    districts,
  };
}

/**
 * Mock Alabama district data (7 districts)
 */
export const MOCK_ALABAMA_DISTRICT_DATA: StateDistrictData = {
  stateCode: TEST_STATE_CODES.ALABAMA,
  districts: [
    { district: 'AL-01', average_household_income_change: 312.45, relative_household_income_change: 0.0187 },
    { district: 'AL-02', average_household_income_change: -45.3, relative_household_income_change: -0.0028 },
    { district: 'AL-03', average_household_income_change: 156.78, relative_household_income_change: 0.0093 },
    { district: 'AL-04', average_household_income_change: -89.12, relative_household_income_change: -0.0054 },
    { district: 'AL-05', average_household_income_change: 234.56, relative_household_income_change: 0.014 },
    { district: 'AL-06', average_household_income_change: 0, relative_household_income_change: 0 },
    { district: 'AL-07', average_household_income_change: -123.45, relative_household_income_change: -0.0075 },
  ],
};

/**
 * Mock California district data (52 districts, abbreviated)
 */
export const MOCK_CALIFORNIA_DISTRICT_DATA: StateDistrictData = {
  stateCode: TEST_STATE_CODES.CALIFORNIA,
  districts: [
    { district: 'CA-01', average_household_income_change: 412.88, relative_household_income_change: 0.025 },
    { district: 'CA-02', average_household_income_change: -156.32, relative_household_income_change: -0.0095 },
    { district: 'CA-52', average_household_income_change: 612.88, relative_household_income_change: 0.041 },
  ],
};

/**
 * Mock DC district data (1 at-large district)
 */
export const MOCK_DC_DISTRICT_DATA: StateDistrictData = {
  stateCode: TEST_STATE_CODES.DC,
  districts: [
    { district: 'DC-00', average_household_income_change: 289.34, relative_household_income_change: 0.0173 },
  ],
};

// ============================================================================
// Mock Fetch States
// ============================================================================

/**
 * Initial fetch state (nothing started)
 */
export const MOCK_INITIAL_FETCH_STATE: FetchState = {
  stateResponses: new Map(),
  completedStates: new Set(),
  loadingStates: new Set(),
  erroredStates: new Set(),
  hasStarted: false,
};

/**
 * Loading fetch state (some states loading)
 */
export const MOCK_LOADING_FETCH_STATE: FetchState = {
  stateResponses: new Map([
    [TEST_STATE_CODES.ALABAMA, MOCK_ALABAMA_DISTRICT_DATA],
  ]),
  completedStates: new Set([TEST_STATE_CODES.ALABAMA]),
  loadingStates: new Set([TEST_STATE_CODES.CALIFORNIA, TEST_STATE_CODES.NEW_YORK]),
  erroredStates: new Set(),
  hasStarted: true,
};

/**
 * Complete fetch state (all states done)
 */
export const MOCK_COMPLETE_FETCH_STATE: FetchState = {
  stateResponses: new Map([
    [TEST_STATE_CODES.ALABAMA, MOCK_ALABAMA_DISTRICT_DATA],
    [TEST_STATE_CODES.CALIFORNIA, MOCK_CALIFORNIA_DISTRICT_DATA],
  ]),
  completedStates: new Set([TEST_STATE_CODES.ALABAMA, TEST_STATE_CODES.CALIFORNIA]),
  loadingStates: new Set(),
  erroredStates: new Set(),
  hasStarted: true,
};

/**
 * Fetch state with some errors
 */
export const MOCK_ERROR_FETCH_STATE: FetchState = {
  stateResponses: new Map([
    [TEST_STATE_CODES.ALABAMA, MOCK_ALABAMA_DISTRICT_DATA],
  ]),
  completedStates: new Set([TEST_STATE_CODES.ALABAMA]),
  loadingStates: new Set(),
  erroredStates: new Set([TEST_STATE_CODES.TEXAS]),
  hasStarted: true,
};

/**
 * State-level fetch state (single state for DC)
 */
export const MOCK_DC_STATE_LEVEL_FETCH_STATE: FetchState = {
  stateResponses: new Map([
    [TEST_STATE_CODES.DC, MOCK_DC_DISTRICT_DATA],
  ]),
  completedStates: new Set([TEST_STATE_CODES.DC]),
  loadingStates: new Set(),
  erroredStates: new Set(),
  hasStarted: true,
};

// ============================================================================
// Mock Fetch Actions
// ============================================================================

export const MOCK_ACTIONS = {
  START_FETCH: {
    type: 'START_FETCH' as const,
    stateCodes: [TEST_STATE_CODES.ALABAMA, TEST_STATE_CODES.CALIFORNIA],
  },
  STATE_COMPLETED_WITH_DATA: {
    type: 'STATE_COMPLETED' as const,
    stateCode: TEST_STATE_CODES.ALABAMA,
    data: MOCK_ALABAMA_DISTRICT_DATA,
  },
  STATE_COMPLETED_NO_DATA: {
    type: 'STATE_COMPLETED' as const,
    stateCode: TEST_STATE_CODES.TEXAS,
    data: null,
  },
  STATE_ERRORED: {
    type: 'STATE_ERRORED' as const,
    stateCode: TEST_STATE_CODES.TEXAS,
  },
  RESET: {
    type: 'RESET' as const,
  },
} satisfies Record<string, FetchAction>;

// ============================================================================
// Mock Context Values
// ============================================================================

/**
 * Create a mock context value for testing
 */
export function createMockContextValue(
  overrides: Partial<CongressionalDistrictDataContextValue> = {}
): CongressionalDistrictDataContextValue {
  return {
    stateResponses: new Map(),
    completedCount: 0,
    loadingCount: 0,
    totalDistrictsLoaded: 0,
    totalStates: 51,
    isComplete: false,
    isLoading: false,
    hasStarted: false,
    errorCount: 0,
    labelLookup: new Map(),
    isStateLevelReport: false,
    stateCode: null,
    startFetch: () => {},
    validateAllLoaded: () => false,
    getCompletedStates: () => [],
    getLoadingStates: () => [],
    ...overrides,
  };
}

/**
 * Mock context value for national report (loading)
 */
export const MOCK_NATIONAL_LOADING_CONTEXT: CongressionalDistrictDataContextValue =
  createMockContextValue({
    stateResponses: new Map([[TEST_STATE_CODES.ALABAMA, MOCK_ALABAMA_DISTRICT_DATA]]),
    completedCount: 1,
    loadingCount: 50,
    totalDistrictsLoaded: 7,
    isLoading: true,
    hasStarted: true,
  });

/**
 * Mock context value for national report (complete)
 */
export const MOCK_NATIONAL_COMPLETE_CONTEXT: CongressionalDistrictDataContextValue =
  createMockContextValue({
    stateResponses: new Map([
      [TEST_STATE_CODES.ALABAMA, MOCK_ALABAMA_DISTRICT_DATA],
      [TEST_STATE_CODES.CALIFORNIA, MOCK_CALIFORNIA_DISTRICT_DATA],
    ]),
    completedCount: 51,
    loadingCount: 0,
    totalDistrictsLoaded: 435,
    isComplete: true,
    hasStarted: true,
    getCompletedStates: () => [TEST_STATE_CODES.ALABAMA, TEST_STATE_CODES.CALIFORNIA],
  });

/**
 * Mock context value for state-level report (DC)
 */
export const MOCK_DC_STATE_LEVEL_CONTEXT: CongressionalDistrictDataContextValue =
  createMockContextValue({
    stateResponses: new Map([[TEST_STATE_CODES.DC, MOCK_DC_DISTRICT_DATA]]),
    completedCount: 1,
    loadingCount: 0,
    totalDistrictsLoaded: 1,
    totalStates: 1,
    isComplete: true,
    hasStarted: true,
    isStateLevelReport: true,
    stateCode: TEST_STRIPPED_STATE_CODES.DC,
    getCompletedStates: () => [TEST_STATE_CODES.DC],
  });

/**
 * Mock context value for state-level report (California)
 */
export const MOCK_CA_STATE_LEVEL_CONTEXT: CongressionalDistrictDataContextValue =
  createMockContextValue({
    stateResponses: new Map([[TEST_STATE_CODES.CALIFORNIA, MOCK_CALIFORNIA_DISTRICT_DATA]]),
    completedCount: 1,
    loadingCount: 0,
    totalDistrictsLoaded: 52,
    totalStates: 1,
    isComplete: true,
    hasStarted: true,
    isStateLevelReport: true,
    stateCode: TEST_STRIPPED_STATE_CODES.CALIFORNIA,
    getCompletedStates: () => [TEST_STATE_CODES.CALIFORNIA],
  });

// ============================================================================
// All State Codes (for national reports)
// ============================================================================

export const ALL_US_STATE_CODES = [
  'state/al', 'state/ak', 'state/az', 'state/ar', 'state/ca',
  'state/co', 'state/ct', 'state/de', 'state/dc', 'state/fl',
  'state/ga', 'state/hi', 'state/id', 'state/il', 'state/in',
  'state/ia', 'state/ks', 'state/ky', 'state/la', 'state/me',
  'state/md', 'state/ma', 'state/mi', 'state/mn', 'state/ms',
  'state/mo', 'state/mt', 'state/ne', 'state/nv', 'state/nh',
  'state/nj', 'state/nm', 'state/ny', 'state/nc', 'state/nd',
  'state/oh', 'state/ok', 'state/or', 'state/pa', 'state/ri',
  'state/sc', 'state/sd', 'state/tn', 'state/tx', 'state/ut',
  'state/vt', 'state/va', 'state/wa', 'state/wv', 'state/wi',
  'state/wy',
];

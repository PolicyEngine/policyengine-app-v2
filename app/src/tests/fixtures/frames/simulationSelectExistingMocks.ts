import { CURRENT_YEAR } from '@/constants';
import { vi } from 'vitest';

// Mock selector functions
export const mockSelectCurrentPosition = vi.fn();

// Mock Redux hooks
export const mockUseSelector = (selector: any) => {
  if (selector.toString().includes('metadata')) {
    return { regions: {} }; // Mock metadata state
  }
  return selector({});
};

// Mock policy data for tests
export const MOCK_POLICY_WITH_PARAMS = {
  policy: {
    id: 123,
    country_id: 'us',
    policy_json: {
      income_tax_rate: [{ startDate: `${CURRENT_YEAR}-01-01`, endDate: `${CURRENT_YEAR}-12-31`, value: 0.25 }],
    },
  },
  association: { label: 'My Tax Reform' },
};

export const MOCK_EMPTY_POLICY = {
  policy: {
    id: 456,
    country_id: 'us',
    policy_json: {},
  },
  association: { label: 'Empty Policy' },
};

export const mockPolicyData = [MOCK_POLICY_WITH_PARAMS, MOCK_EMPTY_POLICY];

// Mock household data for tests
export const MOCK_HOUSEHOLD_FAMILY = {
  household: {
    id: '123',
    country_id: 'us',
    household_json: { people: {} },
  },
  association: { label: 'My Family' },
};

export const mockHouseholdData = [MOCK_HOUSEHOLD_FAMILY];

// Mock geographic data for tests
export const MOCK_GEOGRAPHIC_US = {
  geography: {
    id: 'mock-geography',
    countryId: 'us',
    scope: 'national',
    geographyId: 'us',
    name: 'United States',
  },
  association: { label: 'US National' },
};

export const mockGeographicData = [MOCK_GEOGRAPHIC_US];

// Mock hook responses
export const mockLoadingResponse = {
  data: null,
  isLoading: true,
  isError: false,
  error: null,
};

export const mockErrorResponse = (errorMessage: string) => ({
  data: null,
  isLoading: false,
  isError: true,
  error: new Error(errorMessage),
});

export const mockSuccessResponse = (data: any) => ({
  data,
  isLoading: false,
  isError: false,
  error: null,
});

// Mock adapters
export const mockHouseholdAdapter = {
  fromAPI: (household: any) => ({
    id: household.id,
    countryId: household.country_id,
    householdData: household.household_json || {},
  }),
};

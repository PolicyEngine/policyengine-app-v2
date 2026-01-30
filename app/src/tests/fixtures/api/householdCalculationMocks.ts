import { vi } from 'vitest';
import { HouseholdCalculationResponse } from '@/api/householdCalculation';
import { CURRENT_YEAR } from '@/constants';
import { Household } from '@/types/ingredients/Household';

// Test IDs and constants
export const TEST_COUNTRIES = {
  US: 'us',
  UK: 'uk',
  CA: 'ca',
} as const;

export const TEST_HOUSEHOLD_IDS = {
  EXISTING: '12345',
  NON_EXISTENT: '99999',
  LARGE_HOUSEHOLD: '67890',
} as const;

export const TEST_POLICY_IDS = {
  BASELINE: 'baseline-001',
  REFORM: 'reform-002',
  INVALID: 'invalid-999',
} as const;

export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const ERROR_MESSAGES = {
  CALCULATION_FAILED: (statusText: string) => `Household calculation failed: ${statusText}`,
  TIMEOUT: 'Household calculation timed out after 4 minutes',
  API_ERROR: 'Household calculation failed',
  NETWORK_ERROR: 'Network error',
  INVALID_PARAMETERS: 'Invalid parameters provided for household calculation',
} as const;

// Mock response helpers
export const mockSuccessResponse = (data: any) => ({
  ok: true,
  status: HTTP_STATUS.OK,
  json: vi.fn().mockResolvedValue(data),
});

export const mockErrorResponse = (status: number) => ({
  ok: false,
  status,
  statusText: status === HTTP_STATUS.NOT_FOUND ? 'Not Found' : 'Error',
});

// Mock household result
export const mockHouseholdResult: Household = {
  id: TEST_HOUSEHOLD_IDS.EXISTING,
  tax_benefit_model_name: 'policyengine_us',
  year: parseInt(CURRENT_YEAR),
  people: [
    {
      person_id: 0,
      name: 'person1',
      age: 30,
      employment_income: 50000,
      capital_gains: 5000,
      person_family_id: 0,
      person_tax_unit_id: 0,
      person_household_id: 0,
    },
    {
      person_id: 1,
      name: 'person2',
      age: 28,
      employment_income: 45000,
      dividend_income: 2000,
      person_family_id: 0,
      person_tax_unit_id: 0,
      person_household_id: 0,
    },
  ],
  family: [
    {
      family_id: 0,
      family_size: 2,
    },
  ],
  tax_unit: [
    {
      tax_unit_id: 0,
      adjusted_gross_income: 102000,
    },
  ],
  household: [
    {
      household_id: 0,
      household_size: 2,
    },
  ],
};

// UK variant for testing different countries
export const mockHouseholdResultUK: Household = {
  id: TEST_HOUSEHOLD_IDS.EXISTING,
  tax_benefit_model_name: 'policyengine_uk',
  year: parseInt(CURRENT_YEAR),
  people: [
    {
      person_id: 0,
      name: 'person1',
      age: 35,
      employment_income: 40000,
      person_benunit_id: 0,
      person_household_id: 0,
    },
    {
      person_id: 1,
      name: 'person2',
      age: 33,
      employment_income: 35000,
      person_benunit_id: 0,
      person_household_id: 0,
    },
  ],
  benunit: [{ benunit_id: 0 }],
  household: [{ household_id: 0 }],
};

// Large household for testing complex scenarios
export const mockLargeHouseholdResult: Household = {
  id: TEST_HOUSEHOLD_IDS.LARGE_HOUSEHOLD,
  tax_benefit_model_name: 'policyengine_us',
  year: parseInt(CURRENT_YEAR),
  people: [
    {
      person_id: 0,
      name: 'person1',
      age: 40,
      employment_income: 75000,
      person_family_id: 0,
      person_tax_unit_id: 0,
      person_household_id: 0,
    },
    {
      person_id: 1,
      name: 'person2',
      age: 38,
      employment_income: 65000,
      person_family_id: 0,
      person_tax_unit_id: 0,
      person_household_id: 0,
    },
    {
      person_id: 2,
      name: 'person3',
      age: 16,
      person_family_id: 0,
      person_tax_unit_id: 0,
      person_household_id: 0,
    },
    {
      person_id: 3,
      name: 'person4',
      age: 14,
      person_family_id: 0,
      person_tax_unit_id: 0,
      person_household_id: 0,
    },
    {
      person_id: 4,
      name: 'person5',
      age: 10,
      person_family_id: 0,
      person_tax_unit_id: 0,
      person_household_id: 0,
    },
  ],
  family: [
    {
      family_id: 0,
      family_size: 5,
    },
  ],
  tax_unit: [
    {
      tax_unit_id: 0,
      adjusted_gross_income: 140000,
    },
  ],
  household: [
    {
      household_id: 0,
      household_size: 5,
    },
  ],
};

// Mock API responses
export const mockSuccessfulCalculationResponse: HouseholdCalculationResponse = {
  status: 'ok',
  result: mockHouseholdResult,
};

export const mockErrorCalculationResponse: HouseholdCalculationResponse = {
  status: 'error',
  result: null,
  error: ERROR_MESSAGES.INVALID_PARAMETERS,
};

export const mockUKCalculationResponse: HouseholdCalculationResponse = {
  status: 'ok',
  result: mockHouseholdResultUK,
};

// Network error mock
export const mockNetworkError = new Error(ERROR_MESSAGES.NETWORK_ERROR);

// Abort error mock for timeout testing
export const mockAbortError = (() => {
  const error = new Error('The operation was aborted');
  error.name = 'AbortError';
  return error;
})();

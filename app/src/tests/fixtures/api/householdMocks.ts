import { vi } from 'vitest';
import { HouseholdV2Response } from '@/api/v2/households';
import { CURRENT_YEAR } from '@/constants';
import { Household } from '@/types/ingredients/Household';
import { HouseholdMetadata } from '@/types/metadata/householdMetadata';
import { HouseholdCalculatePayload } from '@/types/payloads';

// Test household IDs - descriptive names for clarity
export const EXISTING_HOUSEHOLD_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
export const NON_EXISTENT_HOUSEHOLD_ID = '00000000-0000-0000-0000-000000000000';
export const NEW_HOUSEHOLD_ID = 'f9e8d7c6-b5a4-3210-fedc-ba9876543210';

// Country codes used in tests
export const TEST_COUNTRIES = {
  US: 'us',
  UK: 'uk',
  CA: 'ca',
} as const;

// HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// Error messages that match the actual implementation (v2 alpha API)
export const ERROR_MESSAGES = {
  FETCH_HOUSEHOLD_FAILED: (id: string) => `Failed to fetch household ${id}`,
  HOUSEHOLD_NOT_FOUND: (id: string) => `Household ${id} not found`,
  CREATE_HOUSEHOLD_FAILED: (status: number, text: string) =>
    `Failed to create household: ${status} ${text}`,
  LIST_HOUSEHOLDS_FAILED: (status: number, text: string) =>
    `Failed to list households: ${status} ${text}`,
  DELETE_HOUSEHOLD_FAILED: (id: string, status: number, text: string) =>
    `Failed to delete household ${id}: ${status} ${text}`,
  NETWORK_ERROR: 'Network error',
  FAILED_TO_FETCH: 'Failed to fetch',
} as const;

// ============================================================================
// V2 Alpha Household Mocks
// ============================================================================

/**
 * Mock Household (app internal format - single dicts for entity groups)
 */
export const mockUSHousehold: Household = {
  tax_benefit_model_name: 'policyengine_us',
  year: parseInt(CURRENT_YEAR, 10),
  people: [
    { age: 30, employment_income: 50000 },
    { age: 28, employment_income: 45000 },
  ],
  tax_unit: { state_code: 'CA' },
  household: { state_fips: 6 },
};

export const mockUKHousehold: Household = {
  tax_benefit_model_name: 'policyengine_uk',
  year: parseInt(CURRENT_YEAR, 10),
  people: [{ age: 35, employment_income: 30000 }],
  benunit: { is_married: false },
  household: { region: 'london' },
};

/**
 * Mock V2 Alpha API response (HouseholdRead schema from API)
 */
export const mockV2HouseholdResponse: HouseholdV2Response = {
  id: EXISTING_HOUSEHOLD_ID,
  tax_benefit_model_name: 'policyengine_us',
  year: parseInt(CURRENT_YEAR, 10),
  label: null,
  people: [
    { age: 30, employment_income: 50000 },
    { age: 28, employment_income: 45000 },
  ],
  tax_unit: { state_code: 'CA' },
  household: { state_fips: 6 },
  created_at: '2025-01-15T10:00:00Z',
  updated_at: '2025-01-15T10:00:00Z',
};

export const mockV2HouseholdResponseUK: HouseholdV2Response = {
  id: 'uk-household-uuid',
  tax_benefit_model_name: 'policyengine_uk',
  year: parseInt(CURRENT_YEAR, 10),
  label: 'UK Test Household',
  people: [{ age: 35, employment_income: 30000 }],
  benunit: { is_married: false },
  household: { region: 'london' },
  created_at: '2025-01-15T10:00:00Z',
  updated_at: '2025-01-15T10:00:00Z',
};

export const mockV2CreatedHouseholdResponse: HouseholdV2Response = {
  id: NEW_HOUSEHOLD_ID,
  tax_benefit_model_name: 'policyengine_us',
  year: parseInt(CURRENT_YEAR, 10),
  label: null,
  people: [{ age: 25 }],
  created_at: '2025-01-15T10:00:00Z',
  updated_at: '2025-01-15T10:00:00Z',
};

// ============================================================================
// Legacy Household Metadata Mocks (for local storage/adapter tests)
// ============================================================================

export const mockHouseholdMetadata: HouseholdMetadata = {
  id: EXISTING_HOUSEHOLD_ID,
  household: mockUSHousehold,
  label: 'Test Household',
  created_at: '2025-01-15T10:00:00Z',
};

// ============================================================================
// Calculation Payload Mocks (arrays for entity groups - calculation format)
// ============================================================================

export const mockHouseholdCalculatePayload: HouseholdCalculatePayload = {
  tax_benefit_model_name: 'policyengine_us',
  year: parseInt(CURRENT_YEAR, 10),
  people: [{ age: 25 }],
};

export const mockHouseholdCalculatePayloadUK: HouseholdCalculatePayload = {
  tax_benefit_model_name: 'policyengine_uk',
  year: parseInt(CURRENT_YEAR, 10),
  people: [{ age: 25 }],
};

// Large household payload for testing complex data handling
// Note: HouseholdCalculatePayload uses arrays for entity groups (calculation format)
export const mockLargeHouseholdPayload: HouseholdCalculatePayload = {
  tax_benefit_model_name: 'policyengine_us',
  year: parseInt(CURRENT_YEAR, 10),
  people: [
    { age: 30, employment_income: 50000 },
    { age: 28, employment_income: 45000 },
    { age: 5, is_tax_unit_dependent: true },
    { age: 3, is_tax_unit_dependent: true },
  ],
  tax_unit: [{}],
};

// ============================================================================
// Mock fetch response helpers
// ============================================================================

export const mockSuccessResponse = (data: any, status: number = HTTP_STATUS.OK) => ({
  ok: true,
  status,
  json: vi.fn().mockResolvedValue(data),
  text: vi.fn().mockResolvedValue(JSON.stringify(data)),
});

export const mockErrorResponse = (status: number, errorText: string = 'Error') => ({
  ok: false,
  status,
  statusText: status === HTTP_STATUS.NOT_FOUND ? 'Not Found' : 'Error',
  text: vi.fn().mockResolvedValue(errorText),
});

export const mockNetworkError = new Error(ERROR_MESSAGES.NETWORK_ERROR);
export const mockFetchError = new Error(ERROR_MESSAGES.FAILED_TO_FETCH);

// V2 Alpha API Base URL (for test URL assertions)
export const API_V2_BASE_URL = 'https://v2.api.policyengine.org';

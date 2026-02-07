import { vi } from 'vitest';
import { HouseholdVariationResponse } from '@/api/householdVariation';
import { HouseholdWithAxes } from '@/utils/householdVariationAxes';

/**
 * Test fixtures for householdVariation API functions.
 * Provides mock household-with-axes data, policy data, and API responses.
 */

// Base household with variation axes for earnings sweep
export const MOCK_HOUSEHOLD_WITH_AXES: HouseholdWithAxes = {
  tax_benefit_model_name: 'policyengine_us',
  year: 2024,
  people: [{ age: 30 }],
  household: { state_name: 'CA' },
  axes: [[{ name: 'employment_income', min: 0, max: 200000, count: 401 }]],
};

// Minimal policy data for variation requests
export const MOCK_POLICY_DATA = { policy: {} };

// Successful API response with earnings variation result
export const MOCK_VARIATION_SUCCESS_RESPONSE: HouseholdVariationResponse = {
  status: 'ok',
  result: { employment_income: [0, 500, 1000] },
};

// Error API response from calculation engine
export const MOCK_VARIATION_ERROR_RESPONSE: HouseholdVariationResponse = {
  status: 'error',
  result: null,
  error: 'Calculation engine error',
};

// API response with null result
export const MOCK_VARIATION_NULL_RESULT_RESPONSE: HouseholdVariationResponse = {
  status: 'ok',
  result: null,
};

// Mock fetch that returns a successful variation response
export const mockFetchSuccess = () =>
  vi.spyOn(globalThis, 'fetch').mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(MOCK_VARIATION_SUCCESS_RESPONSE),
  } as Response);

// Mock fetch that returns an HTTP error
export const mockFetchHttpError = (status: number, statusText: string, body: string) =>
  vi.spyOn(globalThis, 'fetch').mockResolvedValue({
    ok: false,
    status,
    statusText,
    text: () => Promise.resolve(body),
  } as unknown as Response);

// Mock fetch that returns an API-level error
export const mockFetchApiError = () =>
  vi.spyOn(globalThis, 'fetch').mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(MOCK_VARIATION_ERROR_RESPONSE),
  } as Response);

// Mock fetch that returns null result
export const mockFetchNullResult = () =>
  vi.spyOn(globalThis, 'fetch').mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(MOCK_VARIATION_NULL_RESULT_RESPONSE),
  } as Response);

// Mock fetch that simulates an abort error
export const mockFetchAbort = () => {
  const abortError = Object.assign(new Error('The operation was aborted'), {
    name: 'AbortError',
  });
  return vi.spyOn(globalThis, 'fetch').mockRejectedValue(abortError);
};

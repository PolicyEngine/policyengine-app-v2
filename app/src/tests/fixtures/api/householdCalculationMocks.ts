import { vi } from 'vitest';
import {
  HouseholdCalculationResult,
  HouseholdJobResponse,
  HouseholdJobStatusResponse,
} from '@/api/v2/householdCalculation';
import { CURRENT_YEAR } from '@/constants';
import { Household } from '@/types/ingredients/Household';

// ============================================================================
// Test IDs and constants
// ============================================================================

export const TEST_COUNTRIES = {
  US: 'us',
  UK: 'uk',
  CA: 'ca',
} as const;

export const TEST_HOUSEHOLD_IDS = {
  EXISTING: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  NON_EXISTENT: '00000000-0000-0000-0000-000000000000',
  LARGE_HOUSEHOLD: 'f9e8d7c6-b5a4-3210-fedc-ba9876543210',
} as const;

export const TEST_POLICY_IDS = {
  BASELINE: 'baseline-0001-0002-0003-000000000001',
  REFORM: 'reform-0001-0002-0003-000000000002',
  INVALID: 'invalid-0001-0002-0003-000000000999',
} as const;

export const TEST_JOB_IDS = {
  PENDING: 'job-0001-pending',
  RUNNING: 'job-0002-running',
  COMPLETED: 'job-0003-completed',
  FAILED: 'job-0004-failed',
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// ============================================================================
// Error messages
// ============================================================================

export const ERROR_MESSAGES = {
  // V2 alpha error messages
  CREATE_JOB_FAILED: (status: number, text: string) =>
    `Failed to create calculation job: ${status} ${text}`,
  GET_STATUS_FAILED: (status: number, text: string) =>
    `Failed to get job status: ${status} ${text}`,
  JOB_NOT_FOUND: (jobId: string) => `Calculation job ${jobId} not found`,
  CALCULATION_FAILED: 'Calculation failed',
  CALCULATION_TIMEOUT: 'Calculation timed out after 4 minutes',
  NO_RESULT: 'Calculation completed but no result returned',
  // Legacy error messages (for backward compatibility tests)
  LEGACY_CALCULATION_FAILED: (statusText: string) => `Household calculation failed: ${statusText}`,
  TIMEOUT: 'Household calculation timed out after 4 minutes',
  API_ERROR: 'Household calculation failed',
  NETWORK_ERROR: 'Network error',
  INVALID_PARAMETERS: 'Invalid parameters provided for household calculation',
} as const;

// V2 Alpha API Base URL
export const API_V2_BASE_URL = 'https://v2.api.policyengine.org';

// ============================================================================
// Mock response helpers
// ============================================================================

export const mockSuccessResponse = (data: any, status: number = HTTP_STATUS.OK): Response =>
  ({
    ok: true,
    status,
    json: vi.fn().mockResolvedValue(data),
    text: vi.fn().mockResolvedValue(JSON.stringify(data)),
  }) as unknown as Response;

export const mockErrorResponse = (status: number, errorText: string = 'Error'): Response =>
  ({
    ok: false,
    status,
    statusText: status === HTTP_STATUS.NOT_FOUND ? 'Not Found' : 'Error',
    text: vi.fn().mockResolvedValue(errorText),
  }) as unknown as Response;

// ============================================================================
// Mock Household data (app internal format - single dicts)
// ============================================================================

export const mockHouseholdResult: Household = {
  id: TEST_HOUSEHOLD_IDS.EXISTING,
  tax_benefit_model_name: 'policyengine_us',
  year: parseInt(CURRENT_YEAR, 10),
  people: [
    { age: 30, employment_income: 50000, capital_gains: 5000 },
    { age: 28, employment_income: 45000, dividend_income: 2000 },
  ],
  family: { family_size: 2 },
  tax_unit: { adjusted_gross_income: 102000, state_code: 'CA' },
  household: { household_size: 2, state_fips: 6 },
};

export const mockHouseholdResultUK: Household = {
  id: TEST_HOUSEHOLD_IDS.EXISTING,
  tax_benefit_model_name: 'policyengine_uk',
  year: parseInt(CURRENT_YEAR, 10),
  people: [
    { age: 35, employment_income: 40000 },
    { age: 33, employment_income: 35000 },
  ],
  benunit: { is_married: true },
  household: { region: 'LONDON' },
};

export const mockLargeHouseholdResult: Household = {
  id: TEST_HOUSEHOLD_IDS.LARGE_HOUSEHOLD,
  tax_benefit_model_name: 'policyengine_us',
  year: parseInt(CURRENT_YEAR, 10),
  people: [
    { age: 40, employment_income: 75000 },
    { age: 38, employment_income: 65000 },
    { age: 16, is_tax_unit_dependent: true },
    { age: 14, is_tax_unit_dependent: true },
    { age: 10, is_tax_unit_dependent: true },
  ],
  family: { family_size: 5 },
  tax_unit: { adjusted_gross_income: 140000 },
  household: { household_size: 5 },
};

// ============================================================================
// V2 Alpha Mock Responses
// ============================================================================

/**
 * Mock calculation result (v2 alpha format - arrays)
 */
export const mockV2CalculationResult: HouseholdCalculationResult = {
  person: [
    { age: 30, employment_income: 50000, net_income: 42000 },
    { age: 28, employment_income: 45000, net_income: 38000 },
  ],
  tax_unit: [{ state_code: 'CA', income_tax: 8000 }],
  family: [{ family_size: 2 }],
  spm_unit: [{}],
  marital_unit: [{}],
  household: [{ state_fips: 6, household_size: 2 }],
};

export const mockV2CalculationResultUK: HouseholdCalculationResult = {
  person: [
    { age: 35, employment_income: 40000, net_income: 32000 },
    { age: 33, employment_income: 35000, net_income: 28000 },
  ],
  benunit: [{ is_married: true }],
  household: [{ region: 'LONDON' }],
};

/**
 * Mock job creation response
 */
export const mockJobCreatedResponse: HouseholdJobResponse = {
  job_id: TEST_JOB_IDS.PENDING,
  status: 'PENDING',
};

/**
 * Mock job status responses
 */
export const mockJobPendingResponse: HouseholdJobStatusResponse = {
  job_id: TEST_JOB_IDS.PENDING,
  status: 'PENDING',
  result: null,
  error_message: null,
};

export const mockJobRunningResponse: HouseholdJobStatusResponse = {
  job_id: TEST_JOB_IDS.RUNNING,
  status: 'RUNNING',
  result: null,
  error_message: null,
};

export const mockJobCompletedResponse: HouseholdJobStatusResponse = {
  job_id: TEST_JOB_IDS.COMPLETED,
  status: 'COMPLETED',
  result: mockV2CalculationResult,
  error_message: null,
};

export const mockJobFailedResponse: HouseholdJobStatusResponse = {
  job_id: TEST_JOB_IDS.FAILED,
  status: 'FAILED',
  result: null,
  error_message: ERROR_MESSAGES.CALCULATION_FAILED,
};

// ============================================================================
// Error mocks
// ============================================================================

export const mockNetworkError = new Error(ERROR_MESSAGES.NETWORK_ERROR);

export const mockAbortError = (() => {
  const error = new Error('The operation was aborted');
  error.name = 'AbortError';
  return error;
})();

// ============================================================================
// Helper functions for creating mock fetch sequences
// ============================================================================

/**
 * Create a mock fetch that returns different responses on subsequent calls
 * Useful for testing polling behavior
 */
export function createPollingMockFetch(responses: Response[]) {
  let callIndex = 0;
  return vi.fn().mockImplementation(() => {
    const response = responses[Math.min(callIndex, responses.length - 1)];
    callIndex++;
    return Promise.resolve(response);
  });
}

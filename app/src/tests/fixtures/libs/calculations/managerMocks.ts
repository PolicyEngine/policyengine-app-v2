import { QueryClient } from '@tanstack/react-query';
import { vi } from 'vitest';
import { CalculationMeta } from '@/api/reportCalculations';
import { CalculationHandler } from '@/libs/calculations/handlers';
import { CalculationStatusResponse } from '@/libs/calculations/status';

// Test report IDs
export const MANAGER_TEST_REPORT_ID = 'manager-report-123';
export const ANOTHER_MANAGER_REPORT_ID = 'manager-report-456';
export const UNKNOWN_REPORT_ID = 'unknown-report-999';

// Test calculation metadata
export const MANAGER_HOUSEHOLD_META: CalculationMeta = {
  type: 'household',
  countryId: 'us',
  policyIds: {
    baseline: 'manager-policy-baseline',
    reform: 'manager-policy-reform',
  },
  populationId: 'manager-household-001',
};

export const MANAGER_ECONOMY_META: CalculationMeta = {
  type: 'economy',
  countryId: 'uk',
  policyIds: {
    baseline: 'manager-policy-uk-baseline',
  },
  populationId: 'uk',
  region: 'london',
};

// Invalid metadata for testing error cases
export const INVALID_TYPE_META: CalculationMeta = {
  type: 'invalid' as any,
  countryId: 'us',
  policyIds: {
    baseline: 'invalid-policy',
  },
  populationId: 'invalid-001',
};

// Mock status responses
export const MANAGER_COMPUTING_STATUS: CalculationStatusResponse = {
  status: 'computing',
  progress: 25,
  message: 'Processing calculation...',
};

export const MANAGER_OK_STATUS: CalculationStatusResponse = {
  status: 'ok',
  result: {
    testData: 'manager-result',
    value: 42,
  },
};

export const MANAGER_ERROR_STATUS: CalculationStatusResponse = {
  status: 'error',
  error: 'Manager test error',
};

// Mock handlers
export class MockCalculationHandler extends CalculationHandler {
  fetchMock = vi.fn();
  getStatusMock = vi.fn();
  startCalculationMock = vi.fn();

  async fetch(meta: CalculationMeta): Promise<CalculationStatusResponse> {
    return this.fetchMock(meta);
  }

  getStatus(reportId: string): CalculationStatusResponse | null {
    return this.getStatusMock(reportId);
  }

  async startCalculation(reportId: string, meta: CalculationMeta): Promise<void> {
    return this.startCalculationMock(reportId, meta);
  }

  getCacheKey(reportId: string): readonly string[] {
    return ['calculation', reportId] as const;
  }
}

// Helper to create a mock query client with spy methods
export function createMockManagerQueryClient(): QueryClient {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  // Add spy methods
  queryClient.setQueryData = vi.fn();
  queryClient.getQueryData = vi.fn();
  queryClient.invalidateQueries = vi.fn();

  return queryClient;
}

// Helper to create mock handlers for injection
export function createMockHandlers() {
  const householdHandler = new MockCalculationHandler(createMockManagerQueryClient());
  const economyHandler = new MockCalculationHandler(createMockManagerQueryClient());

  return {
    household: householdHandler,
    economy: economyHandler,
  };
}

// Error messages
export const MANAGER_ERROR_MESSAGES = {
  NO_HANDLER: (type: string) => `No handler for calculation type: ${type}`,
  INVALID_TYPE: 'Invalid calculation type provided',
} as const;

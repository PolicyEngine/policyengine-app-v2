import { QueryClient } from '@tanstack/react-query';
import { vi } from 'vitest';
import { EconomyCalculationResponse } from '@/api/economy';
import { CalculationMeta } from '@/api/reportCalculations';
import { Household } from '@/types/ingredients/Household';

// Report IDs
export const TEST_REPORT_ID = 'report-123';
export const ANOTHER_REPORT_ID = 'report-456';

// Calculation metadata mocks
export const HOUSEHOLD_CALCULATION_META: CalculationMeta = {
  type: 'household',
  countryId: 'us',
  policyIds: {
    baseline: 'policy-baseline-123',
    reform: 'policy-reform-456',
  },
  populationId: 'household-789',
};

export const ECONOMY_CALCULATION_META: CalculationMeta = {
  type: 'economy',
  countryId: 'us',
  policyIds: {
    baseline: 'policy-baseline-789',
    reform: 'policy-reform-012',
  },
  populationId: 'us',
  region: 'ca',
};

export const ECONOMY_NATIONAL_META: CalculationMeta = {
  type: 'economy',
  countryId: 'uk',
  policyIds: {
    baseline: 'policy-baseline-uk',
  },
  populationId: 'uk',
};

// Household calculation results
export const MOCK_HOUSEHOLD_RESULT: Household = {
  id: 'household-789',
  countryId: 'us',
  householdData: {
    people: {
      you: {
        age: { 2024: 35 },
        employment_income: { 2024: 50000 },
      },
    },
  },
};

// Economy calculation API responses
export const ECONOMY_COMPUTING_RESPONSE: EconomyCalculationResponse = {
  status: 'computing',
  queue_position: 5,
  average_time: 45000,
  result: null,
};

export const ECONOMY_OK_RESPONSE: EconomyCalculationResponse = {
  status: 'ok',
  result: {
    budget: {
      budgetary_impact: 2500000000,
    },
    poverty: {
      poverty_rate_change: -0.015,
    },
  } as any,
};

export const ECONOMY_ERROR_RESPONSE: EconomyCalculationResponse = {
  status: 'error',
  error: 'Invalid region parameter',
  result: null,
};

// Progress messages for household calculations
export const HOUSEHOLD_PROGRESS_MESSAGES = {
  INITIALIZING: 'Initializing calculation...',
  LOADING: 'Loading household data...',
  RUNNING: 'Running policy simulation...',
  CALCULATING: 'Calculating impacts...',
  FINALIZING: 'Finalizing results...',
} as const;

// Timing constants
export const HOUSEHOLD_ESTIMATED_DURATION = 60000; // 60 seconds
export const CLEANUP_DELAY = 5000; // 5 seconds

// Helper to create a mock QueryClient
export function createMockQueryClient(): QueryClient {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  // Mock setQueryData
  queryClient.setQueryData = vi.fn();

  return queryClient;
}

// Mock fetch functions
export const mockFetchEconomyCalculation = vi.fn();
export const mockFetchHouseholdCalculation = vi.fn();

// Helper to advance time and flush promises
export async function advanceTimeAndFlush(ms: number): Promise<void> {
  vi.advanceTimersByTime(ms);
  // Flush all pending promises
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

// Helper to create a rejected promise with proper error
export function createRejectedPromise(message: string): Promise<never> {
  return Promise.reject(new Error(message));
}

// Helper to create a resolved promise with delay
export function createDelayedPromise<T>(value: T, delay?: number): Promise<T> {
  if (delay === undefined) {
    return Promise.resolve(value);
  }
  return new Promise((resolve) => {
    setTimeout(() => resolve(value), delay);
  });
}

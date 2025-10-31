import { QueryClient } from '@tanstack/react-query';
import { vi } from 'vitest';
import type { CalcStartConfig } from '@/types/calculation';
import { mockReportCalcStartConfig } from '../libs/calculations/orchestrationFixtures';

/**
 * Test constants for calculation hooks
 */
export const HOOK_TEST_CONSTANTS = {
  TEST_REPORT_ID: 'report-hook-123',
  TEST_SIMULATION_ID: 'sim-hook-456',
  TEST_USER_REPORT_ID: 'user-report-789',
} as const;

/**
 * Create a real QueryClient for hook tests
 * This is needed because hooks require a real QueryClient instance
 */
export const createTestQueryClient = (): QueryClient => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
};

/**
 * Mock CalcOrchestrator for hook tests
 */
export const createMockCalcOrchestrator = () => ({
  startCalculation: vi.fn().mockResolvedValue(undefined),
});

/**
 * Mock ResultPersister for hook tests
 */
export const createMockResultPersister = () => ({
  persist: vi.fn().mockResolvedValue(undefined),
});

/**
 * Mock CalcStartConfig for hook tests
 */
export const mockHookCalcStartConfig = (overrides?: Partial<CalcStartConfig>): CalcStartConfig => ({
  ...mockReportCalcStartConfig(),
  calcId: HOOK_TEST_CONSTANTS.TEST_REPORT_ID,
  ...overrides,
});

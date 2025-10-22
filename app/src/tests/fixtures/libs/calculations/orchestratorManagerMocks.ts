import { vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';

/**
 * Mocks for CalcOrchestratorManager tests
 */

// Test query client configuration
export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

// Mock orchestrator instance
export const createMockOrchestrator = () => ({
  startCalculation: vi.fn().mockResolvedValue(undefined),
  cleanup: vi.fn(),
});

// Mock orchestrator that fails on start
export const createMockOrchestratorWithError = (error: Error) => ({
  startCalculation: vi.fn().mockRejectedValue(error),
  cleanup: vi.fn(),
});

// Test error messages
export const TEST_ERROR_MESSAGE = 'Test error';
export const TEST_NETWORK_ERROR = new Error('Network error');

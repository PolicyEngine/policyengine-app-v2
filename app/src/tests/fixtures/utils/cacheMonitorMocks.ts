import { QueryClient } from '@tanstack/react-query';
import { vi } from 'vitest';

export const createMockQueryClient = () => {
  const mockQueryCache = {
    subscribe: vi.fn(),
    getAll: vi.fn(() => []),
  };

  return {
    getQueryCache: vi.fn(() => mockQueryCache),
  } as unknown as QueryClient;
};

export const createMockQuery = (queryKey: any[], state: any = {}) => ({
  queryKey,
  state: {
    fetchStatus: 'idle',
    data: null,
    error: null,
    dataUpdatedAt: Date.now(),
    isInvalidated: false,
    ...state,
  },
  isStale: vi.fn(() => false),
  getObserversCount: vi.fn(() => 0),
});

export const TEST_QUERY_KEYS = {
  SIMULATION: ['simulations', 'simulation_id', 'sim-123'],
  REPORT: ['reports', 'report_id', 'report-456'],
  CALCULATION: ['calculations', 'report', 'calc-789'],
};

export const TEST_SIMULATION_IDS = ['sim-1', 'sim-2', 'sim-3'];

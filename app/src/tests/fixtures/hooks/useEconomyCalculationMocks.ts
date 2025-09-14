import { vi } from 'vitest';
import { mockUSReportOutput } from '../api/economyMocks';

// Test constants
export const GC_WORKFLOW_TIMEOUT = 25 * 60 * 1000; // 25 minutes

export const TEST_COUNTRIES = {
  US: 'us',
  UK: 'uk',
} as const;

export const TEST_POLICY_IDS = {
  REFORM: '123',
  BASELINE: '456',
} as const;

export const TEST_REGIONS = {
  ENHANCED_US: 'enhanced_us',
  STANDARD: 'standard',
} as const;

// Mock store states
export const mockInitialReportState = {
  reportId: '',
  simulationIds: [],
  status: 'pending' as const,
  output: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const mockCompletedReportState = {
  reportId: 'report-123',
  simulationIds: ['sim-1', 'sim-2'],
  status: 'complete' as const,
  output: mockUSReportOutput,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const mockErrorReportState = {
  reportId: 'report-456',
  simulationIds: ['sim-3'],
  status: 'error' as const,
  output: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Mock callbacks
export const mockOnSuccess = vi.fn();
export const mockOnError = vi.fn();
export const mockOnQueueUpdate = vi.fn();

// Mock dispatch
export const mockDispatch = vi.fn();

// Mock fetch responses for React Query
export const createMockQueryClient = () => ({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: 0,
      gcTime: 0,
    },
  },
});
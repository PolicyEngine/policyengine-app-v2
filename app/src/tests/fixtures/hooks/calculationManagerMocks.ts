import { vi } from 'vitest';
import { CalculationMeta } from '@/api/reportCalculations';
import { CalculationStatusResponse } from '@/libs/calculations/status';

// Mock calculation responses
export const MOCK_HOUSEHOLD_CALCULATION_RESPONSE: CalculationStatusResponse = {
  status: 'ok',
  result: {
    household_id: 'household-123',
    baseline_net_income: 50000,
    reform_net_income: 52000,
  },
};

export const MOCK_ECONOMY_CALCULATION_RESPONSE: CalculationStatusResponse = {
  status: 'ok',
  result: {
    budget: { budgetary_impact: 1000000 },
    poverty: { poverty_rate_change: -0.05 },
  },
};

export const MOCK_COMPUTING_RESPONSE: CalculationStatusResponse = {
  status: 'computing',
  progress: 0.5,
  message: 'Processing calculation...',
  estimatedTimeRemaining: 10000,
};

export const MOCK_ERROR_RESPONSE: CalculationStatusResponse = {
  status: 'error',
  error: 'Calculation failed',
};

// Mock metadata for different calculation types
export const MOCK_HOUSEHOLD_META: CalculationMeta = {
  type: 'household',
  countryId: 'us',
  policyIds: {
    baseline: 'policy-1',
    reform: 'policy-2',
  },
  populationId: 'household-123',
};

export const MOCK_ECONOMY_META_NATIONAL: CalculationMeta = {
  type: 'economy',
  countryId: 'us',
  policyIds: {
    baseline: 'policy-2',
    reform: 'policy-3',
  },
  populationId: 'us',
};

export const MOCK_ECONOMY_META_SUBNATIONAL: CalculationMeta = {
  type: 'economy',
  countryId: 'us',
  policyIds: {
    baseline: 'policy-2',
    reform: 'policy-3',
  },
  populationId: 'us-california',
  region: 'california',
};

// Mock calculation manager
export const createMockCalculationManager = () => ({
  startCalculation: vi.fn().mockResolvedValue(undefined),
  fetchCalculation: vi.fn(),
  getStatus: vi.fn(),
  getCacheKey: vi.fn((reportId: string) => ['calculation', reportId] as const),
  buildMetadata: vi.fn((params: any) => {
    // Determine type based on simulations
    if (params.simulation1?.populationType === 'household') {
      return MOCK_HOUSEHOLD_META;
    }
    // For economy simulations, check if geography has region
    if (params.geography?.scope === 'subnational') {
      return MOCK_ECONOMY_META_SUBNATIONAL;
    }
    return MOCK_ECONOMY_META_NATIONAL;
  }),
  getQueryOptions: vi.fn((reportId: string, meta: CalculationMeta) => ({
    queryKey: ['calculation', reportId] as const,
    queryFn: vi.fn().mockResolvedValue(MOCK_HOUSEHOLD_CALCULATION_RESPONSE),
    refetchInterval: vi.fn(() => false),
    staleTime: Infinity,
  })),
});

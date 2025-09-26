import { vi } from 'vitest';
import { BuildMetadataParams, CalculationService } from '@/libs/calculations/service';
import { CalculationMeta } from '@/api/reportCalculations';
import { CalculationStatusResponse } from '@/libs/calculations/status';
import { mockHouseholdMetadata, mockCreateHouseholdResponse } from '@/tests/fixtures/api/householdMocks';
import { mockEconomyCalculationResult } from '@/tests/fixtures/api/economyMocks';
import { mockSimulation } from '@/tests/fixtures/api/simulationMocks';

// Test constants for service
export const TEST_REPORT_ID = 'report-123';
export const TEST_REPORT_ID_ECONOMY = 'report-456';
export const TEST_REPORT_ID_HOUSEHOLD = 'report-789';
export const TEST_COUNTRIES = {
  US: 'us',
  UK: 'uk',
  CA: 'ca',
} as const;

// Mock geography
export const mockGeography = {
  id: 'us',
  geographyId: 'us',
  scope: 'national',
  countryId: 'us',
};

// Mock household for build params
const mockHousehold = {
  id: 'household-123',
  countryId: 'us',
  householdData: mockHouseholdMetadata.household_json,
};

// Build metadata params
export const HOUSEHOLD_BUILD_PARAMS: BuildMetadataParams = {
  simulation1: {
    ...mockSimulation,
    populationType: 'household',
    policyId: 'policy-baseline',
  },
  simulation2: {
    ...mockSimulation,
    populationType: 'household',
    policyId: 'policy-reform',
  },
  household: mockHousehold,
  geography: null,
  countryId: TEST_COUNTRIES.US as string,
};

export const ECONOMY_BUILD_PARAMS: BuildMetadataParams = {
  simulation1: {
    ...mockSimulation,
    populationType: 'geography',
    policyId: 'policy-baseline',
  },
  simulation2: {
    ...mockSimulation,
    populationType: 'geography',
    policyId: 'policy-reform',
  },
  household: null,
  geography: mockGeography,
  countryId: TEST_COUNTRIES.US as string,
};

// Metadata results
export const HOUSEHOLD_META: CalculationMeta = {
  type: 'household',
  countryId: TEST_COUNTRIES.US as any,
  policyIds: {
    baseline: 'policy-baseline',
    reform: 'policy-reform',
  },
  populationId: 'household-123',
  region: undefined,
};

export const ECONOMY_META: CalculationMeta = {
  type: 'economy',
  countryId: TEST_COUNTRIES.US as any,
  policyIds: {
    baseline: 'policy-baseline',
    reform: 'policy-reform',
  },
  populationId: 'us',
  region: undefined,
};

// Status responses
export const COMPUTING_STATUS: CalculationStatusResponse = {
  status: 'computing',
  progress: 50,
  message: 'Running policy simulation...',
  estimatedTimeRemaining: 30000,
};

// Mock household result
export const mockHouseholdResult = {
  id: 'household-123',
  countryId: 'us',
  householdData: mockHouseholdMetadata.household_json,
};

export const OK_STATUS_HOUSEHOLD: CalculationStatusResponse = {
  status: 'ok',
  result: mockHouseholdResult,
};

export const OK_STATUS_ECONOMY: CalculationStatusResponse = {
  status: 'ok',
  result: mockEconomyCalculationResult,
};

export const ERROR_STATUS: CalculationStatusResponse = {
  status: 'error',
  error: 'Calculation failed',
};

// Mock service
export const createMockCalculationService = (): jest.Mocked<CalculationService> => ({
  buildMetadata: vi.fn().mockReturnValue(HOUSEHOLD_META),
  getQueryOptions: vi.fn().mockReturnValue({
    queryKey: ['calculation', TEST_REPORT_ID],
    queryFn: vi.fn(),
    refetchInterval: false,
    staleTime: Infinity,
  }),
  executeCalculation: vi.fn().mockResolvedValue(OK_STATUS_HOUSEHOLD),
  getHandler: vi.fn(),
  getStatus: vi.fn().mockReturnValue(null),
});
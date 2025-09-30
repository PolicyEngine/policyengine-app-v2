import { vi, type Mocked } from 'vitest';
import { BuildMetadataParams, CalculationService } from '@/libs/calculations/service';
import { CalculationMeta } from '@/api/reportCalculations';
import { CalculationStatusResponse } from '@/libs/calculations/status';
import { mockHouseholdMetadata } from '@/tests/fixtures/api/householdMocks';

// Create inline mocks for missing fixtures
const mockSimulation = {
  id: 'sim-1',
  countryId: 'us' as const,
  policyId: 'policy-1',
  populationId: 'pop-1',
  populationType: 'household' as const,
  label: 'Test Simulation',
  isCreated: true,
  apiVersion: 'v1',
};

const mockEconomyCalculationResult = {
  status: 'ok',
  result: { impact: 1000 },
};

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
  scope: 'national' as const,
  countryId: 'us' as const,
};

// Mock household for build params
import { Household } from '@/types/ingredients/Household';

// Convert metadata HouseholdData to ingredients HouseholdData
const convertedHouseholdData: Household['householdData'] = {
  people: mockHouseholdMetadata.household_json.people,
  families: mockHouseholdMetadata.household_json.families,
  tax_units: mockHouseholdMetadata.household_json.tax_units,
  spm_units: mockHouseholdMetadata.household_json.spm_units,
  households: mockHouseholdMetadata.household_json.households,
  marital_units: mockHouseholdMetadata.household_json.marital_units,
};

const mockHousehold: Household = {
  id: 'household-123',
  countryId: 'us',
  householdData: convertedHouseholdData,
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
  countryId: TEST_COUNTRIES.US,
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
  countryId: TEST_COUNTRIES.US,
};

// Metadata results
export const HOUSEHOLD_META: CalculationMeta = {
  type: 'household',
  countryId: TEST_COUNTRIES.US as 'us',
  policyIds: {
    baseline: 'policy-baseline',
    reform: 'policy-reform',
  },
  populationId: 'household-123',
  region: undefined,
};

export const ECONOMY_META: CalculationMeta = {
  type: 'economy',
  countryId: TEST_COUNTRIES.US as 'us',
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
export const mockHouseholdResult: Household = {
  id: 'household-123',
  countryId: 'us',
  householdData: convertedHouseholdData,
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
export const createMockCalculationService = (): Mocked<CalculationService> => {
  const mockService: Partial<Mocked<CalculationService>> = {
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
  };

  return mockService as Mocked<CalculationService>;
};
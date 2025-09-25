import { CalculationStatusResponse } from '@/libs/calculations/status';
import { Geography } from '@/types/ingredients/Geography';
import { Household } from '@/types/ingredients/Household';
import { Simulation } from '@/types/ingredients/Simulation';

// Simulation mocks
export const HOUSEHOLD_SIMULATION: Partial<Simulation> = {
  populationType: 'household',
  policyId: 'policy-123',
  populationId: 'household-456',
};

export const GEOGRAPHY_SIMULATION: Partial<Simulation> = {
  populationType: 'geography',
  policyId: 'policy-789',
  populationId: 'geography-101',
};

export const UNKNOWN_SIMULATION: Partial<Simulation> = {
  populationType: 'unknown' as any,
  policyId: 'policy-000',
  populationId: 'unknown-000',
};

// Household mocks
export const VALID_HOUSEHOLD: Partial<Household> = {
  id: 'household-123',
  countryId: 'us',
  householdData: {
    people: {},
  },
};

export const HOUSEHOLD_WITHOUT_ID: Partial<Household> = {
  countryId: 'us',
  householdData: {
    people: {},
  },
};

// Geography mocks
export const NATIONAL_GEOGRAPHY: Partial<Geography> = {
  id: 'geo-123',
  geographyId: 'us',
  scope: 'national',
  countryId: 'us',
};

export const SUBNATIONAL_GEOGRAPHY: Partial<Geography> = {
  id: 'geo-456',
  geographyId: 'ca',
  scope: 'subnational',
  countryId: 'us',
};

export const GEOGRAPHY_WITH_ONLY_ID: Partial<Geography> = {
  id: 'geo-789',
  scope: 'national',
  countryId: 'us',
};

export const GEOGRAPHY_WITHOUT_IDS: Partial<Geography> = {
  scope: 'national',
  countryId: 'us',
};

// Calculation status responses
export const COMPUTING_STATUS_RESPONSE: CalculationStatusResponse = {
  status: 'computing',
  progress: 50,
  message: 'Running policy simulation...',
  estimatedTimeRemaining: 12500,
};

export const COMPUTING_WITH_QUEUE_RESPONSE: CalculationStatusResponse = {
  status: 'computing',
  queuePosition: 3,
  averageTime: 30000,
};

export const OK_STATUS_RESPONSE: CalculationStatusResponse = {
  status: 'ok',
  result: {
    budget: {
      budgetary_impact: -1000000000,
    },
    poverty: {
      poverty_rate_change: -0.02,
    },
  },
};

export const ERROR_STATUS_RESPONSE: CalculationStatusResponse = {
  status: 'error',
  error: 'Calculation failed: Invalid policy parameters',
};

// Error messages
export const ERROR_MESSAGES = {
  UNKNOWN_POPULATION_TYPE: (type: string | undefined) => `Unknown population type: ${type}`,
  HOUSEHOLD_ID_REQUIRED: 'Household ID required for household calculation',
  GEOGRAPHY_REQUIRED: 'Geography required for economy calculation',
} as const;

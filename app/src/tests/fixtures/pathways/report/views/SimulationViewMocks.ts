import { SimulationStateProps } from '@/types/pathwayState';

export const TEST_SIMULATION_LABEL = 'Test Simulation';
export const TEST_COUNTRY_ID = 'us';

export const mockOnUpdateLabel = vi.fn();
export const mockOnNext = vi.fn();
export const mockOnBack = vi.fn();
export const mockOnCancel = vi.fn();
export const mockOnNavigateToPolicy = vi.fn();
export const mockOnNavigateToPopulation = vi.fn();
export const mockOnSubmit = vi.fn();

export const mockSimulationStateEmpty: SimulationStateProps = {
  id: undefined,
  label: null,
  countryId: TEST_COUNTRY_ID,
  policy: {
    id: undefined,
    label: null,
    parameters: [],
  },
  population: {
    label: null,
    type: null,
    household: null,
    geography: null,
  },
  apiVersion: undefined,
  status: 'pending',
};

export const mockSimulationStateConfigured: SimulationStateProps = {
  id: '123',
  label: 'Test Simulation',
  countryId: TEST_COUNTRY_ID,
  policy: {
    id: '456',
    label: 'Current Law',
    parameters: [],
  },
  population: {
    label: 'My Household',
    type: 'household',
    household: {
      id: '789',
      tax_benefit_model_name: 'policyengine_us',
      year: 2025,
      people: [],
    },
    geography: null,
  },
  apiVersion: '0.1.0',
  status: 'complete',
};

export const mockSimulationStateWithPolicy: SimulationStateProps = {
  ...mockSimulationStateEmpty,
  policy: {
    id: '456',
    label: 'Current Law',
    parameters: [],
  },
};

export const mockSimulationStateWithPopulation: SimulationStateProps = {
  ...mockSimulationStateEmpty,
  population: {
    label: 'My Household',
    type: 'household',
    household: {
      id: '789',
      tax_benefit_model_name: 'policyengine_us',
      year: 2025,
      people: [],
    },
    geography: null,
  },
};

export function resetAllMocks() {
  mockOnUpdateLabel.mockClear();
  mockOnNext.mockClear();
  mockOnBack.mockClear();
  mockOnCancel.mockClear();
  mockOnNavigateToPolicy.mockClear();
  mockOnNavigateToPopulation.mockClear();
  mockOnSubmit.mockClear();
}

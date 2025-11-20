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
    countryId: TEST_COUNTRY_ID,
    parameters: [],
  },
  population: {
    label: null,
    type: null,
    household: null,
    geography: null,
  },
  apiVersion: null,
  status: 'pending',
};

export const mockSimulationStateConfigured: SimulationStateProps = {
  id: '123',
  label: 'Test Simulation',
  countryId: TEST_COUNTRY_ID,
  policy: {
    id: '456',
    label: 'Current Law',
    countryId: TEST_COUNTRY_ID,
    parameters: [],
  },
  population: {
    label: 'My Household',
    type: 'household',
    household: {
      id: '789',
      label: 'My Household',
      people: {},
    },
    geography: null,
  },
  apiVersion: '0.1.0',
  status: 'completed',
};

export const mockSimulationStateWithPolicy: SimulationStateProps = {
  ...mockSimulationStateEmpty,
  policy: {
    id: '456',
    label: 'Current Law',
    countryId: TEST_COUNTRY_ID,
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
      label: 'My Household',
      people: {},
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

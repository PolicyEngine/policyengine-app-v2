import { vi } from 'vitest';

export const ERROR_MESSAGES = {
  FETCH_FAILED: 'Failed to fetch simulations',
} as const;

export const mockSimulationData = [
  {
    userSimulation: {
      id: 'sim-assoc-1',
      userId: 1,
      simulationId: 1001,
      countryId: 'us',
      label: 'Test Simulation 1',
      isCreated: true,
      createdAt: '2024-01-15T10:00:00Z',
    },
    simulation: {
      id: '1001',
      countryId: 'us',
      policyId: '101',
      householdId: '501',
      populationType: 'household',
      populationId: '501',
    },
    userPolicy: {
      id: 'pol-assoc-1',
      userId: 1,
      policyId: 101,
      label: 'Test Policy 1',
      createdAt: '2024-01-10T10:00:00Z',
    },
    policy: {
      id: '101',
      countryId: 'us',
      parameters: [],
    },
    userHousehold: {
      id: 'hh-assoc-1',
      userId: 1,
      householdId: 501,
      label: 'Test Household 1',
      createdAt: '2024-01-05T10:00:00Z',
    },
    household: {
      id: '501',
      country_id: 'us',
      household_json: {},
    },
    geography: null,
  },
  {
    userSimulation: {
      id: 'sim-assoc-2',
      userId: 1,
      simulationId: 1002,
      countryId: 'us',
      label: 'Test Simulation 2',
      isCreated: true,
      createdAt: '2024-02-20T14:30:00Z',
    },
    simulation: {
      id: '1002',
      countryId: 'us',
      policyId: '102',
      populationType: 'geography',
      populationId: 'national',
    },
    userPolicy: {
      id: 'pol-assoc-2',
      userId: 1,
      policyId: 102,
      label: 'Test Policy 2',
      createdAt: '2024-02-15T10:00:00Z',
    },
    policy: {
      id: '102',
      countryId: 'us',
      parameters: [],
    },
    userHousehold: null,
    household: null,
    geography: {
      name: 'United States',
    },
  },
];

export const mockDefaultHookReturn = {
  data: mockSimulationData,
  isLoading: false,
  isError: false,
  error: null,
};

export const mockLoadingHookReturn = {
  data: undefined,
  isLoading: true,
  isError: false,
  error: null,
};

export const mockErrorHookReturn = {
  data: undefined,
  isLoading: false,
  isError: true,
  error: new Error(ERROR_MESSAGES.FETCH_FAILED),
};

export const mockEmptyHookReturn = {
  data: [],
  isLoading: false,
  isError: false,
  error: null,
};

export const createMockDispatch = () => vi.fn();

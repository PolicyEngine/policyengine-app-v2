import { ReportStateProps, SimulationStateProps } from '@/types/pathwayState';

export const TEST_REPORT_LABEL = 'Test Report 2025';
export const TEST_SIMULATION_LABEL = 'Test Simulation';
export const TEST_COUNTRY_ID = 'us';
export const TEST_CURRENT_LAW_ID = 1;

export const mockOnUpdateLabel = vi.fn();
export const mockOnNext = vi.fn();
export const mockOnBack = vi.fn();
export const mockOnCancel = vi.fn();
export const mockOnCreateNew = vi.fn();
export const mockOnLoadExisting = vi.fn();
export const mockOnSelectDefaultBaseline = vi.fn();
export const mockOnNavigateToSimulationSelection = vi.fn();
export const mockOnPrefillPopulation2 = vi.fn();
export const mockOnSelectSimulation = vi.fn();
export const mockOnSubmit = vi.fn();

export const mockSimulationState: SimulationStateProps = {
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

export const mockConfiguredSimulation: SimulationStateProps = {
  id: '123',
  label: 'Baseline Simulation',
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
      countryId: 'us',
      householdData: {
        people: {},
      },
    },
    geography: null,
  },
  apiVersion: '0.1.0',
  status: 'complete',
};

export const mockReportState: ReportStateProps = {
  id: undefined,
  label: null,
  countryId: TEST_COUNTRY_ID,
  simulations: [mockSimulationState, mockSimulationState],
  apiVersion: null,
  status: 'pending',
  outputType: undefined,
  output: null,
};

export const mockReportStateWithConfiguredBaseline: ReportStateProps = {
  ...mockReportState,
  simulations: [mockConfiguredSimulation, mockSimulationState],
};

export const mockReportStateWithBothConfigured: ReportStateProps = {
  ...mockReportState,
  simulations: [
    mockConfiguredSimulation,
    { ...mockConfiguredSimulation, id: '124', label: 'Reform Simulation' },
  ],
};

export const mockUseCurrentCountry = vi.fn(() => TEST_COUNTRY_ID);

export const mockUseUserSimulationsEmpty = {
  data: [],
  isLoading: false,
  isError: false,
  error: null,
};

export const mockEnhancedUserSimulation = {
  userSimulation: { id: 1, label: 'My Simulation', simulation_id: '123', user_id: 1 },
  simulation: {
    id: '123',
    label: 'Test Simulation',
    policyId: '456',
    populationId: '789',
    countryId: TEST_COUNTRY_ID,
  },
  userPolicy: { id: 1, label: 'Test Policy', policy_id: '456', user_id: 1 },
  policy: { id: '456', label: 'Current Law', countryId: TEST_COUNTRY_ID },
  userHousehold: { id: 1, label: 'Test Household', household_id: '789', user_id: 1 },
  household: { id: '789', label: 'My Household', people: {} },
  geography: null,
};

export const mockUseUserSimulationsWithData = {
  data: [mockEnhancedUserSimulation],
  isLoading: false,
  isError: false,
  error: null,
};

export const mockUseUserSimulationsLoading = {
  data: undefined,
  isLoading: true,
  isError: false,
  error: null,
};

export const mockUseUserSimulationsError = {
  data: undefined,
  isLoading: false,
  isError: true,
  error: new Error('Failed to load simulations'),
};

export const mockUseUserHouseholdsEmpty = {
  data: [],
  isLoading: false,
  isError: false,
  error: null,
  associations: [],
};

export const mockUseUserGeographicsEmpty = {
  data: [],
  isLoading: false,
  isError: false,
  error: null,
  associations: [],
};

export function resetAllMocks() {
  mockOnUpdateLabel.mockClear();
  mockOnNext.mockClear();
  mockOnBack.mockClear();
  mockOnCancel.mockClear();
  mockOnCreateNew.mockClear();
  mockOnLoadExisting.mockClear();
  mockOnSelectDefaultBaseline.mockClear();
  mockOnNavigateToSimulationSelection.mockClear();
  mockOnPrefillPopulation2.mockClear();
  mockOnSelectSimulation.mockClear();
  mockOnSubmit.mockClear();
}

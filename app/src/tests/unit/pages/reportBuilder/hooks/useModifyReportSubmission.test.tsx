import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { useModifyReportSubmission } from '@/pages/reportBuilder/hooks/useModifyReportSubmission';
import {
  createTestStore,
  CURRENT_LAW_ID,
  mockCreateSimulationFn,
  mockLocalStorageCreateFn,
  mockOnSuccess,
  mockTwoSimReportState,
  setupDefaultMocks,
  TEST_LABELS,
  TEST_SIMULATION_IDS,
} from '@/tests/fixtures/pages/reportBuilder/useReportSubmissionMocks';

const { mockIngredientAvailability } = vi.hoisted(() => ({
  mockIngredientAvailability: vi.fn(),
}));

// Mock modules
vi.mock('@/api/simulation', () => ({
  createSimulation: (...args: any[]) => mockCreateSimulationFn(...args),
}));

vi.mock('@/api/simulationAssociation', () => ({
  LocalStorageSimulationStore: vi.fn().mockImplementation(() => ({
    create: mockLocalStorageCreateFn,
  })),
}));

vi.mock('@/api/report', () => ({
  createReport: vi.fn().mockResolvedValue({
    id: 'base-report-new',
    country_id: 'us',
    year: '2026',
    simulation_ids: ['new-sim-1', 'new-sim-2'],
  }),
  createReportAndAssociateWithUser: vi.fn().mockResolvedValue({
    report: {
      id: 'base-report-new',
      countryId: 'us',
      year: '2026',
      simulationIds: ['new-sim-1', 'new-sim-2'],
    },
    userReport: { id: 'user-report-new' },
  }),
}));

vi.mock('@/adapters', () => ({
  SimulationAdapter: {
    toCreationPayload: (data: any) => ({
      population_id: data.populationId,
      policy_id: data.policyId,
      population_type: data.populationType,
    }),
  },
  ReportAdapter: {
    toCreationPayload: (data: any) => ({
      country_id: data.countryId,
      year: data.year,
      simulation_ids: data.simulationIds,
    }),
    fromMetadata: (metadata: any) => ({
      id: metadata.id,
      countryId: metadata.country_id,
      year: metadata.year,
      simulationIds: metadata.simulation_ids,
    }),
  },
}));

vi.mock('@/constants', () => ({
  MOCK_USER_ID: 'anonymous',
  CURRENT_YEAR: '2026',
}));

vi.mock('@/pages/reportBuilder/hooks/useReportIngredientAvailability', () => ({
  useReportIngredientAvailability: () => mockIngredientAvailability(),
}));

const mockMutateAsync = vi.fn().mockResolvedValue({});

vi.mock('@/hooks/useUserReportAssociations', () => ({
  useUpdateReportAssociation: () => ({
    mutateAsync: mockMutateAsync,
  }),
}));

vi.mock('@/contexts/CalcOrchestratorContext', () => ({
  useCalcOrchestratorManager: () => ({
    startCalculation: vi.fn().mockResolvedValue(undefined),
  }),
}));

vi.mock('@/libs/queryKeys', () => ({
  reportKeys: { all: ['reports'] },
  reportAssociationKeys: { all: ['reportAssociations'] },
}));

describe('useModifyReportSubmission', () => {
  let queryClient: QueryClient;
  let mockStore: ReturnType<typeof createTestStore>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  const EXISTING_USER_REPORT_ID = 'existing-user-report-1';

  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaultMocks();
    mockIngredientAvailability.mockReturnValue({
      hasUnavailableIngredients: false,
      isCheckingIngredientAvailability: false,
      isReportConfigured: true,
    });

    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    mockStore = createTestStore(CURRENT_LAW_ID);
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={mockStore}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/us/report-builder']}>
          <Routes>
            <Route path="/:countryId/*" element={children} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>
  );

  describe('localStorage association creation via handleSaveAsNew', () => {
    test('given two simulations when saving as new then creates two localStorage associations', async () => {
      // Given
      const { result } = renderHook(
        () =>
          useModifyReportSubmission({
            reportState: mockTwoSimReportState,
            countryId: 'us',
            existingUserReportId: EXISTING_USER_REPORT_ID,
            onSuccess: mockOnSuccess,
          }),
        { wrapper }
      );

      // When
      await result.current.handleSaveAsNew('New Report Label');

      // Then
      await waitFor(() => {
        expect(mockLocalStorageCreateFn).toHaveBeenCalledTimes(2);
      });

      expect(mockLocalStorageCreateFn).toHaveBeenNthCalledWith(1, {
        userId: 'anonymous',
        simulationId: TEST_SIMULATION_IDS.SIM_NEW_1,
        countryId: 'us',
        label: TEST_LABELS.BASELINE,
        isCreated: true,
      });

      expect(mockLocalStorageCreateFn).toHaveBeenNthCalledWith(2, {
        userId: 'anonymous',
        simulationId: TEST_SIMULATION_IDS.SIM_NEW_2,
        countryId: 'us',
        label: TEST_LABELS.REFORM,
        isCreated: true,
      });
    });
  });

  describe('localStorage association creation via handleReplace', () => {
    test('given two simulations when replacing then creates two localStorage associations', async () => {
      // Given
      const { result } = renderHook(
        () =>
          useModifyReportSubmission({
            reportState: mockTwoSimReportState,
            countryId: 'us',
            existingUserReportId: EXISTING_USER_REPORT_ID,
            onSuccess: mockOnSuccess,
          }),
        { wrapper }
      );

      // When
      await result.current.handleReplace();

      // Then
      await waitFor(() => {
        expect(mockLocalStorageCreateFn).toHaveBeenCalledTimes(2);
      });

      expect(mockLocalStorageCreateFn).toHaveBeenNthCalledWith(1, {
        userId: 'anonymous',
        simulationId: TEST_SIMULATION_IDS.SIM_NEW_1,
        countryId: 'us',
        label: TEST_LABELS.BASELINE,
        isCreated: true,
      });

      expect(mockLocalStorageCreateFn).toHaveBeenNthCalledWith(2, {
        userId: 'anonymous',
        simulationId: TEST_SIMULATION_IDS.SIM_NEW_2,
        countryId: 'us',
        label: TEST_LABELS.REFORM,
        isCreated: true,
      });
    });

    test('given replace succeeds then calls onSuccess with existing user report ID', async () => {
      // Given
      const { result } = renderHook(
        () =>
          useModifyReportSubmission({
            reportState: mockTwoSimReportState,
            countryId: 'us',
            existingUserReportId: EXISTING_USER_REPORT_ID,
            onSuccess: mockOnSuccess,
          }),
        { wrapper }
      );

      // When
      await result.current.handleReplace();

      // Then
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith(EXISTING_USER_REPORT_ID);
      });
    });
  });

  test('given a selected ingredient has errored then save and replace are blocked', async () => {
    // Given
    mockIngredientAvailability.mockReturnValue({
      hasUnavailableIngredients: true,
      isCheckingIngredientAvailability: false,
      isReportConfigured: false,
    });
    const { result } = renderHook(
      () =>
        useModifyReportSubmission({
          reportState: mockTwoSimReportState,
          countryId: 'us',
          existingUserReportId: EXISTING_USER_REPORT_ID,
          onSuccess: mockOnSuccess,
        }),
      { wrapper }
    );

    // When
    await result.current.handleSaveAsNew('Blocked report');
    await result.current.handleReplace();

    // Then
    expect(result.current.isReportSubmissionBlocked).toBe(true);
    expect(mockCreateSimulationFn).not.toHaveBeenCalled();
    expect(mockLocalStorageCreateFn).not.toHaveBeenCalled();
  });

  test('given an incomplete simulation then save and replace are blocked', async () => {
    // Given
    mockIngredientAvailability.mockReturnValue({
      hasUnavailableIngredients: false,
      isCheckingIngredientAvailability: false,
      isReportConfigured: false,
    });
    const incompleteState = {
      ...mockTwoSimReportState,
      simulations: [
        {
          ...mockTwoSimReportState.simulations[0],
          policy: { id: undefined, label: null, parameters: [] },
        },
        mockTwoSimReportState.simulations[1],
      ],
    };
    const { result } = renderHook(
      () =>
        useModifyReportSubmission({
          reportState: incompleteState as any,
          countryId: 'us',
          existingUserReportId: EXISTING_USER_REPORT_ID,
          onSuccess: mockOnSuccess,
        }),
      { wrapper }
    );

    // When
    await result.current.handleSaveAsNew('Incomplete report');
    await result.current.handleReplace();

    // Then
    expect(result.current.isReportSubmissionBlocked).toBe(true);
    expect(mockCreateSimulationFn).not.toHaveBeenCalled();
    expect(mockLocalStorageCreateFn).not.toHaveBeenCalled();
  });
});

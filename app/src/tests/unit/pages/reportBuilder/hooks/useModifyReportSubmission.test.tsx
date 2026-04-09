import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { createReportAndAssociateWithUser } from '@/api/report';
import { useModifyReportSubmission } from '@/pages/reportBuilder/hooks/useModifyReportSubmission';
import {
  createTestStore,
  CURRENT_LAW_ID,
  mockCreateSimulationFn,
  mockLocalStorageCreateFn,
  mockLocalStorageDeleteFn,
  mockOnSuccess,
  mockTwoSimReportState,
  setupDefaultMocks,
  TEST_LABELS,
  TEST_SIMULATION_IDS,
} from '@/tests/fixtures/pages/reportBuilder/useReportSubmissionMocks';

// Mock modules
vi.mock('@/api/simulation', () => ({
  createSimulation: (...args: any[]) => mockCreateSimulationFn(...args),
}));

vi.mock('@/api/simulationAssociation', () => ({
  LocalStorageSimulationStore: vi.fn().mockImplementation(() => ({
    create: mockLocalStorageCreateFn,
    delete: mockLocalStorageDeleteFn,
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

    test('given invalid budget-window timing when saving as new then falls back to the single start year', async () => {
      const invalidBudgetWindowState = {
        ...mockTwoSimReportState,
        analysisMode: 'budget-window' as const,
        budgetWindowYears: '10',
        year: '2035',
      };

      const { result } = renderHook(
        () =>
          useModifyReportSubmission({
            reportState: invalidBudgetWindowState,
            countryId: 'us',
            existingUserReportId: EXISTING_USER_REPORT_ID,
            onSuccess: mockOnSuccess,
          }),
        { wrapper }
      );

      await result.current.handleSaveAsNew('New Report Label');

      await waitFor(() => {
        expect(createReportAndAssociateWithUser).toHaveBeenCalledWith(
          expect.objectContaining({
            payload: expect.objectContaining({
              year: '2035',
            }),
          })
        );
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

    test('given replacing a hydrated report then deletes previous local associations', async () => {
      const hydratedReportState = {
        ...mockTwoSimReportState,
        simulations: [
          {
            ...mockTwoSimReportState.simulations[0],
            id: 'old-sim-1',
          },
          {
            ...mockTwoSimReportState.simulations[1],
            id: 'old-sim-2',
          },
        ],
      };

      const { result } = renderHook(
        () =>
          useModifyReportSubmission({
            reportState: hydratedReportState as any,
            countryId: 'us',
            existingUserReportId: EXISTING_USER_REPORT_ID,
            onSuccess: mockOnSuccess,
          }),
        { wrapper }
      );

      await result.current.handleReplace();

      await waitFor(() => {
        expect(mockLocalStorageDeleteFn).toHaveBeenCalledTimes(2);
      });

      expect(mockLocalStorageDeleteFn).toHaveBeenCalledWith('anonymous', 'old-sim-1');
      expect(mockLocalStorageDeleteFn).toHaveBeenCalledWith('anonymous', 'old-sim-2');
    });
  });
});

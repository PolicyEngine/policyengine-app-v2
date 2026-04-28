import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { useReportSubmission } from '@/pages/reportBuilder/hooks/useReportSubmission';
import {
  createTestStore,
  CURRENT_LAW_ID,
  mockCreateReportFn,
  mockCreateSimulationFn,
  mockLocalStorageCreateFn,
  mockHouseholdComparisonReportState,
  mockHouseholdSingleReportState,
  mockOnSuccess,
  TEST_POLICY_IDS,
  mockSingleSimReportState,
  mockTwoSimReportState,
  setupDefaultMocks,
  TEST_LABELS,
  TEST_POPULATION,
  TEST_SIMULATION_IDS,
} from '@/tests/fixtures/pages/reportBuilder/useReportSubmissionMocks';

// Mock modules
vi.mock('@/api/simulation', () => ({
  createSimulation: (...args: any[]) => mockCreateSimulationFn(...args),
}));

vi.mock('@/api/simulationAssociation', () => ({
  LocalStorageSimulationStore: vi.fn().mockImplementation(() => ({
    create: mockLocalStorageCreateFn,
  })),
}));

vi.mock('@/hooks/useCreateReport', () => ({
  useCreateReport: () => ({
    createReport: mockCreateReportFn,
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
}));

vi.mock('@/constants', () => ({
  MOCK_USER_ID: 'anonymous',
  CURRENT_YEAR: '2026',
}));

describe('useReportSubmission', () => {
  let queryClient: QueryClient;
  let mockStore: ReturnType<typeof createTestStore>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

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

  describe('localStorage association creation', () => {
    test('given single simulation when submitted then creates localStorage association', async () => {
      // Given
      const { result } = renderHook(
        () =>
          useReportSubmission({
            reportState: mockSingleSimReportState,
            countryId: 'us',
            onSuccess: mockOnSuccess,
          }),
        { wrapper }
      );

      // When
      await result.current.handleSubmit();

      // Then
      await waitFor(() => {
        expect(mockLocalStorageCreateFn).toHaveBeenCalledTimes(1);
        expect(mockLocalStorageCreateFn).toHaveBeenCalledWith({
          userId: 'anonymous',
          simulationId: TEST_SIMULATION_IDS.SIM_NEW_1,
          countryId: 'us',
          label: TEST_LABELS.BASELINE,
          isCreated: true,
        });
      });
    });

    test('given two simulations when submitted then creates two localStorage associations', async () => {
      // Given
      const { result } = renderHook(
        () =>
          useReportSubmission({
            reportState: mockTwoSimReportState,
            countryId: 'us',
            onSuccess: mockOnSuccess,
          }),
        { wrapper }
      );

      // When
      await result.current.handleSubmit();

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

    test('given submission then calls createSimulation before localStorage association', async () => {
      // Given
      const callOrder: string[] = [];
      mockCreateSimulationFn.mockImplementation(() => {
        callOrder.push('createSimulation');
        return Promise.resolve({ result: { simulation_id: TEST_SIMULATION_IDS.SIM_NEW_1 } });
      });
      mockLocalStorageCreateFn.mockImplementation(() => {
        callOrder.push('localStorageCreate');
        return Promise.resolve({});
      });

      const { result } = renderHook(
        () =>
          useReportSubmission({
            reportState: mockSingleSimReportState,
            countryId: 'us',
            onSuccess: mockOnSuccess,
          }),
        { wrapper }
      );

      // When
      await result.current.handleSubmit();

      // Then
      await waitFor(() => {
        expect(callOrder).toEqual(['createSimulation', 'localStorageCreate']);
      });
    });

    test('given submission then passes correct policy ID to createSimulation', async () => {
      // Given
      const { result } = renderHook(
        () =>
          useReportSubmission({
            reportState: mockSingleSimReportState,
            countryId: 'us',
            onSuccess: mockOnSuccess,
          }),
        { wrapper }
      );

      // When
      await result.current.handleSubmit();

      // Then — current-law ID should be converted to currentLawId (0)
      await waitFor(() => {
        expect(mockCreateSimulationFn).toHaveBeenCalledWith(
          'us',
          expect.objectContaining({
            population_id: TEST_POPULATION.GEOGRAPHY_ID,
            policy_id: CURRENT_LAW_ID.toString(),
            population_type: 'geography',
          })
        );
      });
    });

    test('given two simulations when submitted then creates report with explicit economy spec', async () => {
      const { result } = renderHook(
        () =>
          useReportSubmission({
            reportState: mockTwoSimReportState,
            countryId: 'us',
            onSuccess: mockOnSuccess,
          }),
        { wrapper }
      );

      await result.current.handleSubmit();

      await waitFor(() => {
        expect(mockCreateReportFn).toHaveBeenCalledWith(
          expect.objectContaining({
            payload: {
              simulation_1_id: Number(TEST_SIMULATION_IDS.SIM_NEW_1),
              simulation_2_id: Number(TEST_SIMULATION_IDS.SIM_NEW_2),
              year: '2026',
              report_spec_schema_version: 1,
              report_spec: {
                country_id: 'us',
                report_kind: 'economy_comparison',
                time_period: '2026',
                region: TEST_POPULATION.GEOGRAPHY_ID,
                baseline_policy_id: CURRENT_LAW_ID,
                reform_policy_id: Number(TEST_POLICY_IDS.REFORM_POLICY),
                dataset: 'default',
                target: 'general',
                options: {},
              },
            },
          }),
          expect.any(Object)
        );
      });
    });

    test('given one geography simulation when submitted then creates report with explicit economy single spec', async () => {
      const { result } = renderHook(
        () =>
          useReportSubmission({
            reportState: mockSingleSimReportState,
            countryId: 'us',
            onSuccess: mockOnSuccess,
          }),
        { wrapper }
      );

      await result.current.handleSubmit();

      await waitFor(() => {
        expect(mockCreateReportFn).toHaveBeenCalledWith(
          expect.objectContaining({
            payload: {
              simulation_1_id: Number(TEST_SIMULATION_IDS.SIM_NEW_1),
              simulation_2_id: null,
              year: '2026',
              report_spec_schema_version: 1,
              report_spec: {
                country_id: 'us',
                report_kind: 'economy_single',
                time_period: '2026',
                region: TEST_POPULATION.GEOGRAPHY_ID,
                baseline_policy_id: CURRENT_LAW_ID,
                reform_policy_id: CURRENT_LAW_ID,
                dataset: 'default',
                target: 'general',
                options: {},
              },
            },
          }),
          expect.any(Object)
        );
      });
    });

    test('given one household simulation when submitted then creates report with explicit household single spec', async () => {
      const { result } = renderHook(
        () =>
          useReportSubmission({
            reportState: mockHouseholdSingleReportState,
            countryId: 'us',
            onSuccess: mockOnSuccess,
          }),
        { wrapper }
      );

      await result.current.handleSubmit();

      await waitFor(() => {
        expect(mockCreateReportFn).toHaveBeenCalledWith(
          expect.objectContaining({
            payload: {
              simulation_1_id: Number(TEST_SIMULATION_IDS.SIM_NEW_1),
              simulation_2_id: null,
              year: '2026',
              report_spec_schema_version: 1,
              report_spec: {
                country_id: 'us',
                report_kind: 'household_single',
                time_period: '2026',
                simulation_1: {
                  population_type: 'household',
                  population_id: TEST_POPULATION.HOUSEHOLD_ID,
                  policy_id: CURRENT_LAW_ID,
                },
                simulation_2: null,
              },
            },
          }),
          expect.any(Object)
        );
      });
    });

    test('given two household simulations when submitted then creates report with explicit household comparison spec', async () => {
      const { result } = renderHook(
        () =>
          useReportSubmission({
            reportState: mockHouseholdComparisonReportState,
            countryId: 'us',
            onSuccess: mockOnSuccess,
          }),
        { wrapper }
      );

      await result.current.handleSubmit();

      await waitFor(() => {
        expect(mockCreateReportFn).toHaveBeenCalledWith(
          expect.objectContaining({
            payload: {
              simulation_1_id: Number(TEST_SIMULATION_IDS.SIM_NEW_1),
              simulation_2_id: Number(TEST_SIMULATION_IDS.SIM_NEW_2),
              year: '2026',
              report_spec_schema_version: 1,
              report_spec: {
                country_id: 'us',
                report_kind: 'household_comparison',
                time_period: '2026',
                simulation_1: {
                  population_type: 'household',
                  population_id: TEST_POPULATION.HOUSEHOLD_ID,
                  policy_id: CURRENT_LAW_ID,
                },
                simulation_2: {
                  population_type: 'household',
                  population_id: TEST_POPULATION.HOUSEHOLD_ID,
                  policy_id: Number(TEST_POLICY_IDS.REFORM_POLICY),
                },
              },
            },
          }),
          expect.any(Object)
        );
      });
    });
  });

  describe('isReportConfigured', () => {
    test('given fully configured simulations then isReportConfigured is true', () => {
      // When
      const { result } = renderHook(
        () =>
          useReportSubmission({
            reportState: mockTwoSimReportState,
            countryId: 'us',
            onSuccess: mockOnSuccess,
          }),
        { wrapper }
      );

      // Then
      expect(result.current.isReportConfigured).toBe(true);
    });

    test('given simulation without policy then isReportConfigured is false', () => {
      // Given
      const incompleteState = {
        ...mockSingleSimReportState,
        simulations: [
          {
            ...mockSingleSimReportState.simulations[0],
            policy: { id: undefined, label: null, parameters: [] },
          },
        ],
      };

      // When
      const { result } = renderHook(
        () =>
          useReportSubmission({
            reportState: incompleteState as any,
            countryId: 'us',
            onSuccess: mockOnSuccess,
          }),
        { wrapper }
      );

      // Then
      expect(result.current.isReportConfigured).toBe(false);
    });
  });
});

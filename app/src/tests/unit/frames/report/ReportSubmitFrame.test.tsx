import { configureStore } from '@reduxjs/toolkit';
import { render, screen, userEvent } from '@test-utils';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import ReportSubmitFrame from '@/frames/report/ReportSubmitFrame';
import { useCreateReport } from '@/hooks/useCreateReport';
import { useIngredientReset } from '@/hooks/useIngredientReset';
import reportReducer from '@/reducers/reportReducer';
import simulationsReducer from '@/reducers/simulationsReducer';
import {
  clearAllMocks,
  createMockReportState,
  createMockReportStateNoLabels,
  defaultFlowProps,
  mockCreateReport,
  mockReportWithLabel,
  mockResetIngredient,
  mockSimulation1,
} from '@/tests/fixtures/frames/ReportSubmitFrameMocks';
import { Report } from '@/types/ingredients/Report';
import { Simulation } from '@/types/ingredients/Simulation';

// Mock React Router
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// Mock the hooks
vi.mock('@/hooks/useCreateReport', () => ({
  useCreateReport: vi.fn(),
}));

vi.mock('@/hooks/useIngredientReset', () => ({
  useIngredientReset: vi.fn(),
}));

// Mock the adapter
vi.mock('@/adapters', () => ({
  ReportAdapter: {
    toCreationPayload: vi.fn((report: Report) => ({
      simulation_1_id: report.simulationIds[0],
      simulation_2_id: report.simulationIds[1] || null,
    })),
  },
}));

// Mock population reducer selectors
vi.mock('@/reducers/populationReducer', () => ({
  default: vi.fn((state = {}) => state), // Mock the reducer itself
  selectHouseholdAtPosition: vi.fn(() => null),
  selectGeographyAtPosition: vi.fn(() => null),
}));

describe('ReportSubmitFrame', () => {
  let store: any;

  beforeEach(() => {
    clearAllMocks();

    (useCreateReport as any).mockReturnValue({
      createReport: mockCreateReport,
      isPending: false,
    });

    (useIngredientReset as any).mockReturnValue({
      resetIngredient: mockResetIngredient,
    });

    // Create Redux store with test data
    store = configureStore({
      reducer: {
        report: reportReducer,
        simulations: simulationsReducer,
      },
      preloadedState: createMockReportState(),
    });
  });

  const renderComponent = (props: Partial<Parameters<typeof ReportSubmitFrame>[0]> = {}) => {
    return render(
      <Provider store={store}>
        <ReportSubmitFrame {...defaultFlowProps} {...props} />
      </Provider>
    );
  };

  describe('rendering', () => {
    test('given two simulations then displays both in summary boxes', () => {
      // When
      renderComponent();

      // Then
      expect(screen.getByText('Review Report Configuration')).toBeInTheDocument();
      expect(screen.getByText('Test Simulation 1')).toBeInTheDocument();
      expect(screen.getByText('Test Simulation 2')).toBeInTheDocument();
      expect(screen.getByText('Policy #1 • Population #1')).toBeInTheDocument();
      expect(screen.getByText('Policy #2 • Population #2')).toBeInTheDocument();
    });

    test('given position-based storage then accesses simulations by position', () => {
      // Given - verify the state structure is position-based
      const state = store.getState();

      // Then - verify simulations are stored in position-based array
      expect(state.simulations.simulations).toHaveLength(2);
      expect(state.simulations.simulations[0]).toMatchObject({
        id: '1',
        label: 'Test Simulation 1',
      });
      expect(state.simulations.simulations[1]).toMatchObject({
        id: '2',
        label: 'Test Simulation 2',
      });

      // When
      renderComponent();

      // Then - verify the component correctly displays both simulations
      expect(screen.getByText('Test Simulation 1')).toBeInTheDocument();
      expect(screen.getByText('Test Simulation 2')).toBeInTheDocument();
    });

    test('given simulations without labels then shows IDs', () => {
      // Given
      store = configureStore({
        reducer: {
          report: reportReducer,
          simulations: simulationsReducer,
        },
        preloadedState: createMockReportStateNoLabels(),
      });

      // When
      renderComponent();

      // Then
      expect(screen.getByText('Simulation #1')).toBeInTheDocument();
      expect(screen.getByText('Simulation #2')).toBeInTheDocument();
    });

    test('given report label then passes to useCreateReport hook', () => {
      // When
      renderComponent();

      // Then
      expect(useCreateReport).toHaveBeenCalledWith('My Test Report');
    });

    test('given missing simulation at position then handles gracefully', () => {
      // Given - only one simulation at position 0
      store = configureStore({
        reducer: {
          report: reportReducer,
          simulations: simulationsReducer,
        },
        preloadedState: {
          report: {
            ...mockReportWithLabel,
            activeSimulationPosition: 0 as 0 | 1,
            mode: 'report' as const,
          } as any,
          simulations: {
            simulations: [mockSimulation1, null] as [Simulation | null, Simulation | null],
            activePosition: null as 0 | 1 | null,
          },
        },
      });

      // When
      renderComponent();

      // Then
      expect(screen.getByText('Test Simulation 1')).toBeInTheDocument();
      expect(screen.getByText('No simulation')).toBeInTheDocument();
    });
  });

  describe('submission', () => {
    test('given valid data when submit clicked then creates report with populations', async () => {
      // Given
      const user = userEvent.setup();
      renderComponent();

      // When
      await user.click(screen.getByRole('button', { name: /Generate Report/i }));

      // Then
      expect(mockCreateReport).toHaveBeenCalledWith(
        {
          countryId: 'us',
          payload: {
            simulation_1_id: '1',
            simulation_2_id: '2',
          },
          simulations: {
            simulation1: expect.objectContaining({
              id: '1',
              label: 'Test Simulation 1',
            }),
            simulation2: expect.objectContaining({
              id: '2',
              label: 'Test Simulation 2',
            }),
          },
          populations: {
            household1: null,
            household2: null,
            geography1: null,
            geography2: null,
          },
        },
        {
          onSuccess: expect.any(Function),
        }
      );
    });

    test('given successful creation then navigates using UserReport ID and resets', async () => {
      // Given
      const user = userEvent.setup();
      const mockReportData = {
        id: 'report-123',
        status: 'pending',
        userReportId: 'sur-report-123'
      };
      mockCreateReport.mockImplementation((_data: any, options: any) => {
        options.onSuccess(mockReportData);
        return Promise.resolve();
      });
      renderComponent();

      // When
      await user.click(screen.getByRole('button', { name: /Generate Report/i }));

      // Then
      expect(mockNavigate).toHaveBeenCalledWith(`report-output/${mockReportData.userReportId}`);
      expect(mockResetIngredient).toHaveBeenCalledWith('report');
    });

    test('given in subflow when successful then does not reset', async () => {
      // Given
      const user = userEvent.setup();
      const mockReportData = {
        id: 'report-456',
        status: 'pending',
        userReportId: 'sur-report-456'
      };
      mockCreateReport.mockImplementation((_data: any, options: any) => {
        options.onSuccess(mockReportData);
        return Promise.resolve();
      });
      renderComponent({ isInSubflow: true });

      // When
      await user.click(screen.getByRole('button', { name: /Generate Report/i }));

      // Then
      expect(mockNavigate).toHaveBeenCalledWith(`report-output/${mockReportData.userReportId}`);
      expect(mockResetIngredient).not.toHaveBeenCalled();
    });

    test('given pending state then shows loading button', () => {
      // Given
      (useCreateReport as any).mockReturnValue({
        createReport: mockCreateReport,
        isPending: true,
      });

      // When
      renderComponent();

      // Then
      const button = screen.getByRole('button', { name: /Generate Report/i });
      expect(button).toHaveAttribute('data-loading', 'true');
    });

    test('given successful creation then passes data to onSuccess callback', async () => {
      // Given
      const user = userEvent.setup();
      const mockReportData = {
        id: 'report-789',
        status: 'pending',
        countryId: 'us',
        simulationIds: ['1', '2'],
        userReportId: 'sur-report-789'
      };
      let capturedData: any = null;
      mockCreateReport.mockImplementation((_data: any, options: any) => {
        // Capture what's passed to onSuccess
        capturedData = mockReportData;
        options.onSuccess(mockReportData);
        return Promise.resolve();
      });
      renderComponent();

      // When
      await user.click(screen.getByRole('button', { name: /Generate Report/i }));

      // Then - verify the callback received the report data
      expect(capturedData).toEqual(mockReportData);
      expect(mockNavigate).toHaveBeenCalledWith(`report-output/${mockReportData.userReportId}`);
    });

    test('given missing userReportId then throws error', async () => {
      // Given
      const user = userEvent.setup();
      const mockReportData = {
        id: 'report-999',
        status: 'pending'
        // No userReportId
      };

      let thrownError: unknown;
      mockCreateReport.mockImplementation((_data: any, options: any) => {
        // Wrap in try-catch to simulate error handling
        try {
          options.onSuccess(mockReportData);
        } catch (error) {
          thrownError = error;
        }
        return Promise.resolve();
      });

      // Clear previous mock navigate calls
      mockNavigate.mockClear();
      renderComponent();

      // When
      await user.click(screen.getByRole('button', { name: /Generate Report/i }));

      // Then
      expect(thrownError).toBeInstanceOf(Error);
      expect((thrownError as Error).message).toBe('UserReport ID not found in report data. Report created but navigation failed.');
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    test('given household and geography data available then passes populations to createReport', async () => {
      // Given
      const mockHousehold = {
        id: 'household-123',
        countryId: 'us',
        householdData: { people: {} },
      };
      const mockGeography = {
        id: 'us-california',
        countryId: 'us',
        scope: 'subnational' as const,
        geographyId: 'california',
        name: 'California',
      };

      // Mock the selectors to return population data
      const { selectHouseholdAtPosition, selectGeographyAtPosition } = await import(
        '@/reducers/populationReducer'
      );
      (selectHouseholdAtPosition as any).mockImplementation((_state: any, position: number) => {
        return position === 0 ? mockHousehold : null;
      });
      (selectGeographyAtPosition as any).mockImplementation((_state: any, position: number) => {
        return position === 0 ? mockGeography : null;
      });

      const user = userEvent.setup();
      renderComponent();

      // When
      await user.click(screen.getByRole('button', { name: /Generate Report/i }));

      // Then
      expect(mockCreateReport).toHaveBeenCalledWith(
        expect.objectContaining({
          populations: {
            household1: mockHousehold,
            household2: null,
            geography1: mockGeography,
            geography2: null,
          },
        }),
        expect.any(Object)
      );
    });
  });
});

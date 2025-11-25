import { configureStore } from '@reduxjs/toolkit';
import { render, screen, userEvent, waitFor } from '@test-utils';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import ReportSetupFrame from '@/frames/report/ReportSetupFrame';
import ReportSubmitFrame from '@/frames/report/ReportSubmitFrame';
import reportReducer from '@/reducers/reportReducer';
import simulationsReducer from '@/reducers/simulationsReducer';
import {
  BASELINE_SIMULATION_TITLE,
  COMPARISON_SIMULATION_OPTIONAL_TITLE,
  MOCK_HOUSEHOLD_SIMULATION,
  REVIEW_REPORT_LABEL,
} from '@/tests/fixtures/frames/ReportSetupFrame';

// Mock Plotly
vi.mock('react-plotly.js', () => ({ default: vi.fn(() => null) }));

// Mock hooks
vi.mock('@/hooks/useCreateReport', () => ({
  useCreateReport: () => ({
    createReport: vi.fn(),
    isPending: false,
  }),
}));

vi.mock('@/hooks/useIngredientReset', () => ({
  useIngredientReset: () => ({
    resetIngredient: vi.fn(),
  }),
}));

vi.mock('@/hooks/useUserHousehold', () => ({
  useUserHouseholds: () => ({
    data: [],
    isLoading: false,
    isError: false,
    error: null,
    associations: [],
  }),
  isHouseholdMetadataWithAssociation: vi.fn(() => false),
}));

vi.mock('@/hooks/useUserGeographic', () => ({
  useUserGeographics: () => ({
    data: [],
    isLoading: false,
    isError: false,
    error: null,
    associations: [],
  }),
  isGeographicMetadataWithAssociation: vi.fn(() => false),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

describe('Single Simulation Report Flow Integration', () => {
  let store: any;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        report: reportReducer,
        simulations: simulationsReducer,
      },
      preloadedState: {
        report: {
          id: '',
          countryId: 'us' as const,
          year: '2024',
          apiVersion: 'v1',
          label: null,
          simulationIds: [],
          status: 'pending' as const,
          output: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          activeSimulationPosition: 0 as const,
          mode: 'standalone' as const,
        },
        simulations: {
          simulations: [null, null] as [null, null],
        },
      },
    });
  });

  test('given user configures household simulation then can proceed without comparison simulation', async () => {
    // Given
    const user = userEvent.setup();
    const mockOnNavigate = vi.fn();
    const flowProps = {
      onNavigate: mockOnNavigate,
      onReturn: vi.fn(),
      flowConfig: { component: 'ReportSetupFrame' as any, on: {} },
      isInSubflow: false,
      flowDepth: 0,
    };

    render(
      <Provider store={store}>
        <ReportSetupFrame {...flowProps} />
      </Provider>
    );

    // When - Select baseline simulation card
    await user.click(screen.getByText(BASELINE_SIMULATION_TITLE));

    // Then - Setup baseline button should appear
    expect(screen.getByRole('button', { name: /setup baseline simulation/i })).toBeInTheDocument();

    // When - Configure baseline simulation in store
    await waitFor(() => {
      store.dispatch({
        type: 'simulations/createSimulationAtPosition',
        payload: { position: 0, simulation: MOCK_HOUSEHOLD_SIMULATION },
      });
    });

    // Then - Review report button should be enabled (component re-renders automatically)
    await waitFor(() => {
      const reviewButton = screen.getByRole('button', { name: REVIEW_REPORT_LABEL });
      expect(reviewButton).toBeEnabled();
    });

    // Then - Comparison simulation should show as optional
    expect(screen.getByText(COMPARISON_SIMULATION_OPTIONAL_TITLE)).toBeInTheDocument();
  });

  test('given user configures geography simulation then cannot proceed without comparison simulation', async () => {
    // Given
    const mockOnNavigate = vi.fn();
    const flowProps = {
      onNavigate: mockOnNavigate,
      onReturn: vi.fn(),
      flowConfig: { component: 'ReportSetupFrame' as any, on: {} },
      isInSubflow: false,
      flowDepth: 0,
    };

    // Configure geography simulation in store
    const geographySim = {
      ...MOCK_HOUSEHOLD_SIMULATION,
      populationType: 'geography' as const,
      populationId: 'geography_1',
    };

    store.dispatch({
      type: 'simulations/createSimulationAtPosition',
      payload: { position: 0, simulation: geographySim },
    });

    // When
    render(
      <Provider store={store}>
        <ReportSetupFrame {...flowProps} />
      </Provider>
    );

    // Then - Review report button should be disabled
    const reviewButton = screen.getByRole('button', { name: REVIEW_REPORT_LABEL });
    expect(reviewButton).toBeDisabled();

    // Then - Comparison simulation should show as required
    expect(screen.getByText(/comparison simulation$/i)).toBeInTheDocument();
    expect(screen.getByText(/required/i)).toBeInTheDocument();
  });

  test('given single household simulation configured then submit frame allows submission', () => {
    // Given
    store.dispatch({
      type: 'simulations/createSimulationAtPosition',
      payload: { position: 0, simulation: MOCK_HOUSEHOLD_SIMULATION },
    });

    const flowProps = {
      onNavigate: vi.fn(),
      onReturn: vi.fn(),
      flowConfig: { component: 'ReportSubmitFrame' as any, on: {} },
      isInSubflow: false,
      flowDepth: 0,
    };

    // When
    render(
      <Provider store={store}>
        <ReportSubmitFrame {...flowProps} />
      </Provider>
    );

    // Then - Submit button should be enabled
    const generateButton = screen.getByRole('button', { name: /generate report/i });
    expect(generateButton).toBeEnabled();

    // Then - Should show baseline simulation summary
    expect(screen.getByText('Baseline simulation')).toBeInTheDocument();
    expect(screen.getByText(MOCK_HOUSEHOLD_SIMULATION.label!)).toBeInTheDocument();
  });
});

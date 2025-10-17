import { configureStore } from '@reduxjs/toolkit';
import { screen, userEvent } from '@test-utils';
import { render, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { MantineProvider } from '@mantine/core';
import SimulationSetupFrame from '@/frames/simulation/SimulationSetupFrame';
import SimulationSetupPolicyFrame from '@/frames/simulation/SimulationSetupPolicyFrame';
import flowReducer from '@/reducers/flowReducer';
import metadataReducer, { fetchMetadataThunk } from '@/reducers/metadataReducer';
import policyReducer from '@/reducers/policyReducer';
import populationReducer from '@/reducers/populationReducer';
import reportReducer from '@/reducers/reportReducer';
import simulationsReducer from '@/reducers/simulationsReducer';
import { CountryGuard } from '@/routing/guards/CountryGuard';
import {
  createMetadataFetchMock,
  expectedCurrentLawPolicyUS,
  INTEGRATION_TEST_COUNTRIES,
  INTEGRATION_TEST_CURRENT_LAW_IDS,
  mockPopulation,
} from '@/tests/fixtures/integration/currentLawFlowMocks';
import { policyEngineTheme } from '@/theme';

/**
 * Integration tests for Current Law selection in simulation creation flow.
 *
 * These tests verify that:
 * 1. Current Law button appears in SimulationSetupPolicyFrame
 * 2. Selecting Current Law creates the correct policy
 * 3. Policy uses country-specific current law ID from metadata
 * 4. Current Law policy appears correctly in SimulationSetupFrame
 * 5. Full flow works from policy selection to simulation setup
 */

// Mock Plotly
vi.mock('react-plotly.js', () => ({ default: vi.fn(() => null) }));

// Mock fetch for metadata
const mockFetch = vi.fn();
global.fetch = mockFetch as any;

describe('Current Law Simulation Flow Integration', () => {
  let store: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();

    // Create a fresh store for each test
    store = configureStore({
      reducer: {
        report: reportReducer,
        simulations: simulationsReducer,
        policy: policyReducer,
        population: populationReducer,
        flow: flowReducer,
        metadata: metadataReducer,
      },
    });
  });

  const renderPolicyFrameWithRouter = (country: string = 'us') => {
    // Setup metadata fetch mock
    mockFetch.mockImplementation(createMetadataFetchMock(country));

    // Dispatch metadata fetch
    store.dispatch(fetchMetadataThunk(country));

    const mockFlowProps = {
      onNavigate: vi.fn(),
      onReturn: vi.fn(),
      flowConfig: {
        component: 'SimulationSetupPolicyFrame' as any,
        on: {},
      },
      isInSubflow: false,
      flowDepth: 0,
    };

    return render(
      <Provider store={store}>
        <MantineProvider theme={policyEngineTheme}>
          <MemoryRouter initialEntries={[`/${country}/simulation/setup-policy`]}>
            <Routes>
              <Route path="/:countryId" element={<CountryGuard />}>
                <Route
                  path="simulation/setup-policy"
                  element={<SimulationSetupPolicyFrame {...mockFlowProps} />}
                />
              </Route>
            </Routes>
          </MemoryRouter>
        </MantineProvider>
      </Provider>
    );
  };

  const renderSetupFrameWithRouter = (country: string = 'us') => {
    // Setup metadata fetch mock
    mockFetch.mockImplementation(createMetadataFetchMock(country));

    // Dispatch metadata fetch
    store.dispatch(fetchMetadataThunk(country));

    const mockFlowProps = {
      onNavigate: vi.fn(),
      onReturn: vi.fn(),
      flowConfig: {
        component: 'SimulationSetupFrame' as any,
        on: {},
      },
      isInSubflow: false,
      flowDepth: 0,
    };

    return render(
      <Provider store={store}>
        <MantineProvider theme={policyEngineTheme}>
          <MemoryRouter initialEntries={[`/${country}/simulation/setup`]}>
            <Routes>
              <Route path="/:countryId" element={<CountryGuard />}>
                <Route
                  path="simulation/setup"
                  element={<SimulationSetupFrame {...mockFlowProps} />}
                />
              </Route>
            </Routes>
          </MemoryRouter>
        </MantineProvider>
      </Provider>
    );
  };

  describe('Current Law button in policy selection', () => {
    test('given policy frame loads then Current Law option is visible', async () => {
      // Given/When
      renderPolicyFrameWithRouter('us');

      // Wait for metadata to load
      await waitFor(() => {
        const state = store.getState();
        expect(state.metadata.currentLawId).toBe(INTEGRATION_TEST_CURRENT_LAW_IDS.US);
      });

      // Then
      expect(screen.getByText('Current Law')).toBeInTheDocument();
      expect(
        screen.getByText('Use the baseline tax-benefit system with no reforms')
      ).toBeInTheDocument();
    });

    test('given US context then metadata loads with US current law ID', async () => {
      // Given/When
      renderPolicyFrameWithRouter('us');

      // Then
      await waitFor(() => {
        const state = store.getState();
        expect(state.metadata.currentLawId).toBe(INTEGRATION_TEST_CURRENT_LAW_IDS.US);
        expect(state.metadata.currentCountry).toBe(INTEGRATION_TEST_COUNTRIES.US);
      });
    });

    test('given UK context then metadata loads with UK current law ID', async () => {
      // Given/When
      renderPolicyFrameWithRouter('uk');

      // Then
      await waitFor(() => {
        const state = store.getState();
        expect(state.metadata.currentLawId).toBe(INTEGRATION_TEST_CURRENT_LAW_IDS.UK);
        expect(state.metadata.currentCountry).toBe(INTEGRATION_TEST_COUNTRIES.UK);
      });
    });
  });

  describe('Current Law policy creation', () => {
    test('given user selects Current Law then policy is created with correct ID', async () => {
      // Given
      const user = userEvent.setup();
      renderPolicyFrameWithRouter('us');

      // Wait for metadata to load
      await waitFor(() => {
        const state = store.getState();
        expect(state.metadata.currentLawId).toBe(INTEGRATION_TEST_CURRENT_LAW_IDS.US);
      });

      // When
      const currentLawButton = screen.getByText('Current Law');
      await user.click(currentLawButton);

      const nextButton = screen.getByRole('button', { name: /Next/i });
      await user.click(nextButton);

      // Then
      const state = store.getState();
      const policy = state.policy.policies[0];

      expect(policy).not.toBeNull();
      expect(policy?.id).toBe(INTEGRATION_TEST_CURRENT_LAW_IDS.US.toString());
      expect(policy?.label).toBe('Current law');
      expect(policy?.parameters).toEqual([]);
      expect(policy?.isCreated).toBe(true);
      expect(policy?.countryId).toBe(INTEGRATION_TEST_COUNTRIES.US);
    });

    test('given user selects Current Law in UK then policy uses UK current law ID', async () => {
      // Given
      const user = userEvent.setup();
      renderPolicyFrameWithRouter('uk');

      // Wait for metadata to load
      await waitFor(() => {
        const state = store.getState();
        expect(state.metadata.currentLawId).toBe(INTEGRATION_TEST_CURRENT_LAW_IDS.UK);
      });

      // When
      await user.click(screen.getByText('Current Law'));
      await user.click(screen.getByRole('button', { name: /Next/i }));

      // Then
      const state = store.getState();
      const policy = state.policy.policies[0];

      expect(policy).not.toBeNull();
      expect(policy?.id).toBe(INTEGRATION_TEST_CURRENT_LAW_IDS.UK.toString());
      expect(policy?.countryId).toBe(INTEGRATION_TEST_COUNTRIES.UK);
    });

    test('given Current Law created then policy has empty parameters array', async () => {
      // Given
      const user = userEvent.setup();
      renderPolicyFrameWithRouter('us');

      await waitFor(() => {
        expect(store.getState().metadata.currentLawId).toBe(INTEGRATION_TEST_CURRENT_LAW_IDS.US);
      });

      // When
      await user.click(screen.getByText('Current Law'));
      await user.click(screen.getByRole('button', { name: /Next/i }));

      // Then
      const state = store.getState();
      const policy = state.policy.policies[0];

      expect(policy?.parameters).toEqual([]);
      expect(Array.isArray(policy?.parameters)).toBe(true);
      expect(policy?.parameters?.length).toBe(0);
    });
  });

  describe('Current Law policy display in setup frame', () => {
    test('given Current Law policy created then appears in simulation setup', async () => {
      // Given - Create a current law policy
      const { createPolicyAtPosition } = await import('@/reducers/policyReducer');
      store.dispatch(
        createPolicyAtPosition({
          position: 0,
          policy: expectedCurrentLawPolicyUS,
        })
      );

      // When
      renderSetupFrameWithRouter('us');

      // Wait for metadata
      await waitFor(() => {
        expect(store.getState().metadata.currentLawId).toBe(INTEGRATION_TEST_CURRENT_LAW_IDS.US);
      });

      // Then - Policy card should show Current law
      await waitFor(() => {
        expect(screen.getByText('Current law')).toBeInTheDocument();
      });
    });

    test('given Current Law policy then card shows correct policy ID', async () => {
      // Given
      const { createPolicyAtPosition } = await import('@/reducers/policyReducer');
      store.dispatch(
        createPolicyAtPosition({
          position: 0,
          policy: expectedCurrentLawPolicyUS,
        })
      );

      // When
      renderSetupFrameWithRouter('us');

      await waitFor(() => {
        expect(store.getState().metadata.currentLawId).toBe(INTEGRATION_TEST_CURRENT_LAW_IDS.US);
      });

      // Then
      await waitFor(() => {
        expect(screen.getByText('Current law')).toBeInTheDocument();
        expect(
          screen.getByText(`Policy #${INTEGRATION_TEST_CURRENT_LAW_IDS.US}`)
        ).toBeInTheDocument();
      });
    });

    test('given Current Law policy created then policy card is marked as fulfilled', async () => {
      // Given
      const { createPolicyAtPosition } = await import('@/reducers/policyReducer');
      store.dispatch(
        createPolicyAtPosition({
          position: 0,
          policy: expectedCurrentLawPolicyUS,
        })
      );

      // When
      renderSetupFrameWithRouter('us');

      await waitFor(() => {
        expect(store.getState().metadata.currentLawId).toBe(INTEGRATION_TEST_CURRENT_LAW_IDS.US);
      });

      // Then - Check that the policy in state is marked as created
      const state = store.getState();
      const policy = state.policy.policies[0];
      expect(policy?.isCreated).toBe(true);
    });
  });

  describe('Full simulation flow with Current Law', () => {
    test('given Current Law and population then simulation can be completed', async () => {
      // Given - Create current law policy and population
      const { createPolicyAtPosition } = await import('@/reducers/policyReducer');
      const { createPopulationAtPosition } = await import('@/reducers/populationReducer');

      store.dispatch(
        createPolicyAtPosition({
          position: 0,
          policy: expectedCurrentLawPolicyUS,
        })
      );

      store.dispatch(
        createPopulationAtPosition({
          position: 0,
          population: mockPopulation,
        })
      );

      // When
      renderSetupFrameWithRouter('us');

      await waitFor(() => {
        expect(store.getState().metadata.currentLawId).toBe(INTEGRATION_TEST_CURRENT_LAW_IDS.US);
      });

      // Then - Both cards should be fulfilled
      await waitFor(() => {
        expect(screen.getByText('Current law')).toBeInTheDocument();
        expect(screen.getByText('Test Population')).toBeInTheDocument();
      });

      // And simulation should have both IDs
      await waitFor(() => {
        const state = store.getState();
        const simulation = state.simulations.simulations[0];
        expect(simulation?.policyId).toBe(INTEGRATION_TEST_CURRENT_LAW_IDS.US.toString());
        expect(simulation?.populationId).toBe('household-123');
      });
    });

    test('given Current Law policy only then Next button is disabled', async () => {
      // Given - Only create policy, not population
      const { createPolicyAtPosition } = await import('@/reducers/policyReducer');
      store.dispatch(
        createPolicyAtPosition({
          position: 0,
          policy: expectedCurrentLawPolicyUS,
        })
      );

      // When
      renderSetupFrameWithRouter('us');

      await waitFor(() => {
        expect(store.getState().metadata.currentLawId).toBe(INTEGRATION_TEST_CURRENT_LAW_IDS.US);
      });

      // Then
      await waitFor(() => {
        const nextButton = screen.getByRole('button', { name: /Next/i });
        expect(nextButton).toBeDisabled();
      });
    });

    test('given both policy and population then Next button is enabled', async () => {
      // Given
      const { createPolicyAtPosition } = await import('@/reducers/policyReducer');
      const { createPopulationAtPosition } = await import('@/reducers/populationReducer');

      store.dispatch(
        createPolicyAtPosition({
          position: 0,
          policy: expectedCurrentLawPolicyUS,
        })
      );

      store.dispatch(
        createPopulationAtPosition({
          position: 0,
          population: mockPopulation,
        })
      );

      // When
      renderSetupFrameWithRouter('us');

      await waitFor(() => {
        expect(store.getState().metadata.currentLawId).toBe(INTEGRATION_TEST_CURRENT_LAW_IDS.US);
      });

      // Then
      await waitFor(() => {
        const nextButton = screen.getByRole('button', { name: /Next/i });
        expect(nextButton).not.toBeDisabled();
      });
    });
  });

  describe('Current Law in report mode', () => {
    test('given report mode at position 1 then Current Law creates policy at position 1', async () => {
      // Given - Set up report mode BEFORE rendering
      const { reportSlice } = await import('@/reducers/reportReducer');
      store.dispatch(reportSlice.actions.setMode('report'));
      store.dispatch(reportSlice.actions.setActiveSimulationPosition(1));

      // Verify report mode is set
      let state = store.getState();
      expect(state.report.mode).toBe('report');
      expect(state.report.activeSimulationPosition).toBe(1);

      const user = userEvent.setup();
      renderPolicyFrameWithRouter('us');

      await waitFor(() => {
        expect(store.getState().metadata.currentLawId).toBe(INTEGRATION_TEST_CURRENT_LAW_IDS.US);
      });

      // When
      await user.click(screen.getByText('Current Law'));
      await user.click(screen.getByRole('button', { name: /Next/i }));

      // Then - Policy should be at position 1
      state = store.getState();
      expect(state.policy.policies[0]).toBeNull(); // Position 0 empty
      expect(state.policy.policies[1]).not.toBeNull(); // Position 1 has policy
      expect(state.policy.policies[1]?.id).toBe(INTEGRATION_TEST_CURRENT_LAW_IDS.US.toString());
    });
  });
});

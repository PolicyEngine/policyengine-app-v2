import { configureStore } from '@reduxjs/toolkit';
import { screen, userEvent } from '@test-utils';
import { render, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import flowReducer from '@/reducers/flowReducer';
import metadataReducer from '@/reducers/metadataReducer';
import policyReducer from '@/reducers/policyReducer';
import populationReducer from '@/reducers/populationReducer';
import reportReducer from '@/reducers/reportReducer';
import simulationsReducer from '@/reducers/simulationsReducer';
import { CountryGuard } from '@/routing/guards/CountryGuard';

/**
 * Integration tests for country navigation and state management.
 *
 * These tests verify that:
 * 1. URL is the single source of truth for country ID
 * 2. State is session-scoped (cleared when country changes)
 * 3. Metadata loads correctly after country change
 * 4. No cross-country data contamination occurs
 */

// Test component that displays current country and Redux state
function TestComponent() {
  const { countryId } = useParams<{ countryId: string }>();
  const navigate = useNavigate();

  return (
    <div>
      <div data-testid="current-country">{countryId}</div>
      <button type="button" onClick={() => navigate('/uk/test')}>
        Go to UK
      </button>
      <button type="button" onClick={() => navigate('/us/test')}>
        Go to US
      </button>
      <button type="button" onClick={() => navigate('/ca/test')}>
        Go to CA
      </button>
    </div>
  );
}

// Test component that shows Redux state
function StateDisplay() {
  return (
    <div>
      <div data-testid="state-display">State Viewer</div>
    </div>
  );
}

// TODO: These tests are temporarily skipped because they appear to contribute to
// JavaScript heap out-of-memory errors when running the full test suite.
// This needs to be investigated and resolved.
describe.skip('Country Navigation Integration', () => {
  let store: any;

  beforeEach(() => {
    vi.clearAllMocks();

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

  const renderWithRouter = (initialPath: string) => {
    return render(
      <Provider store={store}>
        <MemoryRouter initialEntries={[initialPath]}>
          <Routes>
            <Route path="/:countryId" element={<CountryGuard />}>
              <Route
                path="test"
                element={
                  <>
                    <TestComponent />
                    <StateDisplay />
                  </>
                }
              />
            </Route>
          </Routes>
        </MemoryRouter>
      </Provider>
    );
  };

  test('given initial load then displays correct country from URL', () => {
    // Given/When
    renderWithRouter('/uk/test');

    // Then
    expect(screen.getByTestId('current-country')).toHaveTextContent('uk');
  });

  test('given navigation to different country then URL updates', async () => {
    // Given
    const user = userEvent.setup();
    renderWithRouter('/us/test');

    // Verify initial state
    expect(screen.getByTestId('current-country')).toHaveTextContent('us');

    // When
    await user.click(screen.getByRole('button', { name: 'Go to UK' }));

    // Then
    await waitFor(() => {
      expect(screen.getByTestId('current-country')).toHaveTextContent('uk');
    });
  });

  test('given navigation to different country then metadata.currentCountry updates', async () => {
    // Given
    const user = userEvent.setup();
    renderWithRouter('/us/test');

    // Verify initial metadata state
    let state = store.getState();
    await waitFor(() => {
      state = store.getState();
      expect(state.metadata.currentCountry).toBe('us');
    });

    // When
    await user.click(screen.getByRole('button', { name: 'Go to UK' }));

    // Then
    await waitFor(() => {
      state = store.getState();
      expect(state.metadata.currentCountry).toBe('uk');
    });
  });

  test('given populated report state when navigating to different country then report is cleared', async () => {
    // Given
    const user = userEvent.setup();
    renderWithRouter('/us/test');

    // Populate report state
    const { reportSlice } = await import('@/reducers/reportReducer');
    store.dispatch(reportSlice.actions.updateLabel('US Report'));
    store.dispatch(reportSlice.actions.addSimulationId('sim-123'));

    // Verify state is populated
    let state = store.getState();
    expect(state.report.label).toBe('US Report');
    expect(state.report.simulationIds).toContain('sim-123');

    // When
    await user.click(screen.getByRole('button', { name: 'Go to UK' }));

    // Then - report should be cleared
    await waitFor(() => {
      state = store.getState();
      expect(state.report.label).toBeNull();
      expect(state.report.simulationIds).toHaveLength(0);
      expect(state.report.countryId).toBe('uk'); // But country should update
    });
  });

  test('given populated policy state when navigating to different country then policies are cleared', async () => {
    // Given
    const user = userEvent.setup();
    renderWithRouter('/us/test');

    // Populate policy state
    const { createPolicyAtPosition } = await import('@/reducers/policyReducer');
    store.dispatch(
      createPolicyAtPosition({
        position: 0,
        policy: { label: 'US Tax Policy', parameters: [] },
      })
    );

    // Verify state is populated
    let state = store.getState();
    expect(state.policy.policies[0]).not.toBeNull();
    expect(state.policy.policies[0]?.label).toBe('US Tax Policy');

    // When
    await user.click(screen.getByRole('button', { name: 'Go to CA' }));

    // Then - policies should be cleared
    await waitFor(() => {
      state = store.getState();
      expect(state.policy.policies[0]).toBeNull();
      expect(state.policy.policies[1]).toBeNull();
    });
  });

  test('given populated simulation state when navigating to different country then simulations are cleared', async () => {
    // Given
    const user = userEvent.setup();
    renderWithRouter('/us/test');

    // Populate simulation state
    const { createSimulationAtPosition } = await import('@/reducers/simulationsReducer');
    store.dispatch(
      createSimulationAtPosition({
        position: 0,
        simulation: { label: 'US Simulation', policyId: 'policy-1', populationId: 'pop-1' },
      })
    );

    // Verify state is populated
    let state = store.getState();
    expect(state.simulations.simulations[0]).not.toBeNull();
    expect(state.simulations.simulations[0]?.label).toBe('US Simulation');

    // When
    await user.click(screen.getByRole('button', { name: 'Go to UK' }));

    // Then - simulations should be cleared
    await waitFor(() => {
      state = store.getState();
      expect(state.simulations.simulations[0]).toBeNull();
      expect(state.simulations.simulations[1]).toBeNull();
    });
  });

  test('given populated population state when navigating to different country then populations are cleared', async () => {
    // Given
    const user = userEvent.setup();
    renderWithRouter('/us/test');

    // Populate population state
    const { createPopulationAtPosition } = await import('@/reducers/populationReducer');
    store.dispatch(
      createPopulationAtPosition({
        position: 0,
        population: { label: 'US Population', household: null, geography: null },
      })
    );

    // Verify state is populated
    let state = store.getState();
    expect(state.population.populations[0]).not.toBeNull();
    expect(state.population.populations[0]?.label).toBe('US Population');

    // When
    await user.click(screen.getByRole('button', { name: 'Go to CA' }));

    // Then - populations should be cleared
    await waitFor(() => {
      state = store.getState();
      expect(state.population.populations[0]).toBeNull();
      expect(state.population.populations[1]).toBeNull();
    });
  });

  test('given multiple country switches then state is cleared each time', async () => {
    // Given
    const user = userEvent.setup();
    renderWithRouter('/us/test');

    // Populate some state
    const { reportSlice } = await import('@/reducers/reportReducer');
    store.dispatch(reportSlice.actions.updateLabel('US Report'));

    // When - switch to UK
    await user.click(screen.getByRole('button', { name: 'Go to UK' }));

    await waitFor(() => {
      const state = store.getState();
      expect(state.report.label).toBeNull();
      expect(state.report.countryId).toBe('uk');
    });

    // Populate UK state
    store.dispatch(reportSlice.actions.updateLabel('UK Report'));

    // When - switch to CA
    await user.click(screen.getByRole('button', { name: 'Go to CA' }));

    // Then - UK state should be cleared
    await waitFor(() => {
      const state = store.getState();
      expect(state.report.label).toBeNull();
      expect(state.report.countryId).toBe('ca');
    });
  });

  test('given navigation within same country then state is preserved', async () => {
    // Given
    const { rerender } = render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/us/test']}>
          <Routes>
            <Route path="/:countryId" element={<CountryGuard />}>
              <Route path="test" element={<TestComponent />} />
              <Route path="other" element={<div data-testid="other-page">Other Page</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </Provider>
    );

    // Populate state
    const { reportSlice } = await import('@/reducers/reportReducer');
    store.dispatch(reportSlice.actions.updateLabel('US Report'));

    // Verify initial state
    let state = store.getState();
    expect(state.report.label).toBe('US Report');

    // When - navigate within same country using rerender
    rerender(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/us/other']}>
          <Routes>
            <Route path="/:countryId" element={<CountryGuard />}>
              <Route path="test" element={<TestComponent />} />
              <Route path="other" element={<div data-testid="other-page">Other Page</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </Provider>
    );

    // Then - state should be preserved (same country)
    state = store.getState();
    expect(state.report.label).toBe('US Report');
    expect(state.report.countryId).toBe('us');
  });
});

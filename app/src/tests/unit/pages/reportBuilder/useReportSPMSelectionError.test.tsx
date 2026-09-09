import { configureStore } from '@reduxjs/toolkit';
import { act, render, screen } from '@test-utils';
import { Provider } from 'react-redux';
import { describe, expect, test, vi } from 'vitest';
import { useReportIngredientAvailability } from '@/pages/reportBuilder/hooks/useReportIngredientAvailability';
import type { ReportBuilderState } from '@/pages/reportBuilder/types';
import metadataReducer, { fetchMetadataThunk } from '@/reducers/metadataReducer';
import { createMockApiPayload } from '@/tests/fixtures/reducers/metadataReducerMocks';
import {
  CANONICAL_SPM_METADATA,
  NATIONAL_SPM,
  RESOLVED_CANONICAL_METADATA,
  RESOLVED_LEGACY_METADATA,
  SPM_TEST_YEAR,
  stateOnlyHousehold,
} from '@/tests/fixtures/spm/spmMocks';
import type { MetadataState } from '@/types/metadata';
import { initializeSimulationState } from '@/utils/pathwayState/initializeSimulationState';

vi.mock('@/hooks/useCurrentCountry', () => ({ useCurrentCountry: () => 'us' }));
vi.mock('@/hooks/useUserPolicy', () => ({
  useUserPolicies: () => ({ data: [], isLoading: false }),
}));
vi.mock('@/hooks/useUserHousehold', () => ({
  useUserHouseholds: () => ({ data: [], isLoading: false }),
}));

function Readiness({ selected }: { selected: boolean }) {
  const simulation = initializeSimulationState();
  simulation.policy.id = 'saved-policy';
  simulation.population.household = (
    selected ? stateOnlyHousehold().withSPM(NATIONAL_SPM) : stateOnlyHousehold()
  ).withId('saved-household');
  const state: ReportBuilderState = { year: SPM_TEST_YEAR, label: null, simulations: [simulation] };
  const availability = useReportIngredientAvailability(state);
  return (
    <>
      <p>{availability.spmSelectionError ?? 'Ready to calculate'}</p>
      <button type="button" disabled={!availability.isReportConfigured}>
        Run report
      </button>
    </>
  );
}

function setup(metadata: MetadataState, selected = false) {
  const store = configureStore({
    reducer: { metadata: metadataReducer },
    preloadedState: { metadata },
  });
  const ui = (hasSelection: boolean) => (
    <Provider store={store}>
      <Readiness selected={hasSelection} />
    </Provider>
  );
  return { store, ui, ...render(ui(selected)) };
}

describe('saved-household report readiness', () => {
  test('given a previously saved state-only household then a report requires an explicit SPM choice', () => {
    const { rerender, ui } = setup(RESOLVED_CANONICAL_METADATA);
    expect(screen.getByText(/choose national or local/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Run report' })).toBeDisabled();
    rerender(ui(true));
    expect(screen.getByText('Ready to calculate')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Run report' })).toBeEnabled();
  });

  test.each([
    ['unrequested', metadataReducer(undefined, { type: 'init' }), /Wait for model information/],
    ['pending', { ...RESOLVED_LEGACY_METADATA, loading: true }, /Wait for model information/],
    ['failed', { ...RESOLVED_LEGACY_METADATA, error: 'Network failure' }, /Reload the page/],
    [
      'different country',
      { ...RESOLVED_LEGACY_METADATA, currentCountry: 'uk' },
      /Wait for model information/,
    ],
  ] as const)(
    'given %s metadata then neither selected nor old households become runnable',
    (_name, metadata, message) => {
      const { rerender, ui } = setup(metadata);
      expect(screen.getByText(message)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Run report' })).toBeDisabled();
      rerender(ui(true));
      expect(screen.getByRole('button', { name: 'Run report' })).toBeDisabled();
    }
  );

  test('given current-country metadata resolves as canonical then the pending household still needs a choice', () => {
    const { store, rerender, ui } = setup(
      metadataReducer(undefined, fetchMetadataThunk.pending('request', 'us'))
    );
    expect(screen.getByRole('button', { name: 'Run report' })).toBeDisabled();
    act(() => {
      store.dispatch(
        fetchMetadataThunk.fulfilled(
          { data: createMockApiPayload({ spm: CANONICAL_SPM_METADATA }), country: 'us' },
          'request',
          'us'
        )
      );
    });
    expect(screen.getByText(/choose national or local/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Run report' })).toBeDisabled();
    rerender(ui(true));
    expect(screen.getByRole('button', { name: 'Run report' })).toBeEnabled();
  });

  test('given current-country metadata resolves without canonical support then an old household becomes runnable', () => {
    const { store } = setup(
      metadataReducer(undefined, fetchMetadataThunk.pending('request', 'us'))
    );
    expect(screen.getByRole('button', { name: 'Run report' })).toBeDisabled();
    act(() => {
      store.dispatch(
        fetchMetadataThunk.fulfilled(
          { data: createMockApiPayload(), country: 'us' },
          'request',
          'us'
        )
      );
    });
    expect(screen.getByRole('button', { name: 'Run report' })).toBeEnabled();
  });
});

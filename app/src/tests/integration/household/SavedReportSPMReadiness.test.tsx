import { configureStore } from '@reduxjs/toolkit';
import { act, render, screen, userEvent } from '@test-utils';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { Household } from '@/models/Household';
import { HouseholdReportOutput } from '@/pages/report-output/HouseholdReportOutput';
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
import { reviewOutput, reviewSimulations } from '@/tests/fixtures/spm/spmReviewMocks';
import type { Report } from '@/types/ingredients/Report';
import type { MetadataState } from '@/types/metadata';

const { startReport, editHousehold } = vi.hoisted(() => ({
  startReport: vi.fn(),
  editHousehold: vi.fn(),
}));
const orchestrator = { startReport, isCalculating: () => false };
vi.mock('@/hooks/household', () => ({
  useHouseholdReportOrchestrator: () => orchestrator,
  useSimulationProgressDisplay: () => ({ displayProgress: 0, hasCalcStatus: false, message: null }),
}));
vi.mock('@/pages/report-output/OverviewSubPage', () => ({
  default: () => <p>Saved household results</p>,
}));

const simulations = reviewSimulations.map((simulation) => ({
  ...simulation,
  status: 'pending' as const,
  output: null,
}));
const households = simulations.map((simulation) =>
  stateOnlyHousehold().withId(simulation.populationId!).withSPM(NATIONAL_SPM)
);
const report: Report = {
  id: 'readiness-report',
  countryId: 'us',
  year: SPM_TEST_YEAR,
  apiVersion: null,
  simulationIds: simulations.map((simulation) => simulation.id!),
  status: 'pending',
  outputType: 'household',
  output: null,
};

function setup(metadata: MetadataState, initialHouseholds: Household[] | undefined = households) {
  const store = configureStore({
    reducer: { metadata: metadataReducer },
    preloadedState: { metadata },
  });
  const ui = (inputs: Household[] | undefined, completed = false) => (
    <Provider store={store}>
      <HouseholdReportOutput
        report={report}
        simulations={
          completed
            ? simulations.map((simulation, index) => ({
                ...simulation,
                status: 'complete',
                output: { result: reviewOutput(index === 0 ? 'baseline' : 'reform').householdData },
              }))
            : simulations
        }
        households={inputs}
        isLoading={false}
        error={null}
        onEditHousehold={editHousehold}
      />
    </Provider>
  );
  return { store, ui, ...render(ui(initialHouseholds)) };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('pending saved household reports wait before starting actual calculations', () => {
  test.each([
    ['unrequested', metadataReducer(undefined, { type: 'init' }), /Wait for model information/],
    ['pending', { ...RESOLVED_CANONICAL_METADATA, loading: true }, /Wait for model information/],
    ['failed', { ...RESOLVED_CANONICAL_METADATA, error: 'Network failure' }, /Reload the page/],
    [
      'different country',
      { ...RESOLVED_LEGACY_METADATA, currentCountry: 'uk' },
      /Wait for model information/,
    ],
  ] as const)(
    'given %s metadata then opening a pending saved report cannot start calculation',
    (_name, metadata, message) => {
      setup(metadata);
      expect(screen.getByRole('status')).toHaveTextContent(message);
      expect(startReport).not.toHaveBeenCalled();
    }
  );

  test('given current-country canonical metadata resolves then actual inputs still require a geography choice', async () => {
    const oldHouseholds = households.map((household) => household.withSPM(undefined));
    const { store, rerender, ui } = setup(
      metadataReducer(undefined, fetchMetadataThunk.pending('request', 'us')),
      oldHouseholds
    );
    act(() => {
      store.dispatch(
        fetchMetadataThunk.fulfilled(
          { data: createMockApiPayload({ spm: CANONICAL_SPM_METADATA }), country: 'us' },
          'request',
          'us'
        )
      );
    });
    expect(screen.getByRole('status')).toHaveTextContent(/choose national or local/);
    expect(startReport).not.toHaveBeenCalled();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Edit household inputs' }));
    expect(editHousehold).toHaveBeenCalledOnce();
    rerender(ui(households));
    expect(startReport).toHaveBeenCalledOnce();
    expect(
      startReport.mock.calls[0][0].simulationConfigs.map(
        (config: { populationId: string }) => config.populationId
      )
    ).toEqual(simulations.map((simulation) => simulation.populationId));
  });

  test('given household inputs have not hydrated then calculation waits until both actual households load', () => {
    const { rerender, ui } = setup(RESOLVED_CANONICAL_METADATA, []);
    expect(screen.getByRole('status')).toHaveTextContent(/Household inputs are unavailable/);
    expect(startReport).not.toHaveBeenCalled();
    rerender(ui([households[0]]));
    expect(startReport).not.toHaveBeenCalled();
    rerender(ui(households));
    expect(startReport).toHaveBeenCalledOnce();
  });

  test('given metadata resolves as legacy then an old saved report may calculate without canonical settings', () => {
    const oldHouseholds = households.map((household) => household.withSPM(undefined));
    const { store } = setup(
      metadataReducer(undefined, fetchMetadataThunk.pending('request', 'us')),
      oldHouseholds
    );
    expect(startReport).not.toHaveBeenCalled();
    act(() => {
      store.dispatch(
        fetchMetadataThunk.fulfilled(
          { data: createMockApiPayload(), country: 'us' },
          'request',
          'us'
        )
      );
    });
    expect(startReport).toHaveBeenCalledOnce();
  });

  test('given completed historical results then unresolved metadata does not block reading or rerun the report', () => {
    const { rerender, ui } = setup(metadataReducer(undefined, { type: 'init' }), []);
    rerender(ui(undefined, true));
    expect(screen.getByText('Saved household results')).toBeInTheDocument();
    expect(screen.queryByText(/Wait for model information/)).not.toBeInTheDocument();
    expect(startReport).not.toHaveBeenCalled();
  });
});

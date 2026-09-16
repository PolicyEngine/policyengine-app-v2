import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor } from '@test-utils';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { Household } from '@/models/Household';
import EarningsVariationSubPage from '@/pages/report-output/earnings-variation/EarningsVariationSubPage';
import metadataReducer, { fetchMetadataThunk } from '@/reducers/metadataReducer';
import { createMockApiPayload } from '@/tests/fixtures/reducers/metadataReducerMocks';
import {
  CANONICAL_SPM_METADATA,
  COUNTY_SPM,
  NATIONAL_SPM,
  RESOLVED_LEGACY_METADATA,
  SPM_TEST_YEAR,
  stateOnlyHousehold,
} from '@/tests/fixtures/spm/spmMocks';
import {
  reviewMetadata,
  reviewOutput,
  reviewSimulations,
} from '@/tests/fixtures/spm/spmReviewMocks';
import type { MetadataState } from '@/types/metadata';

vi.mock('@/hooks/useReportYear', () => ({ useReportYear: () => SPM_TEST_YEAR }));
vi.mock('@/pages/report-output/earnings-variation/BaselineOnlyChart', () => ({
  default: () => <p>Calculated earnings chart</p>,
}));

const fetchMock = vi.fn();
let client: QueryClient;
let savedHousehold: Household;
function householdResponse() {
  return new Response(
    JSON.stringify({
      status: 'ok',
      result: {
        id: 'review-baseline',
        country_id: 'us',
        api_version: 'test-model',
        household_hash: 'test-hash',
        household_json: savedHousehold.toV1CreationPayload().data,
        spm: savedHousehold.spm,
      },
    })
  );
}
function setup(metadata: MetadataState) {
  const store = configureStore({
    reducer: { metadata: metadataReducer },
    preloadedState: { metadata },
  });
  render(
    <Provider store={store}>
      <QueryClientProvider client={client}>
        <EarningsVariationSubPage
          baseline={reviewOutput('baseline')}
          reform={null}
          simulations={[reviewSimulations[0]]}
          policies={[{ id: reviewSimulations[0].policyId!, countryId: 'us', parameters: [] }]}
        />
      </QueryClientProvider>
    </Provider>
  );
  return store;
}
function axesRequests() {
  return fetchMock.mock.calls.filter(([url]) => url.endsWith('/calculate-full'));
}

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  savedHousehold = stateOnlyHousehold();
  fetchMock.mockReset();
  fetchMock.mockImplementation(async (url: string) =>
    url.endsWith('/calculate-full')
      ? new Response(
          JSON.stringify({
            status: 'ok',
            result: reviewOutput('baseline', true).householdData,
            spm_config: savedHousehold.spm,
            spm_provenance: reviewOutput('baseline', true).spmProvenance,
          })
        )
      : householdResponse()
  );
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => {
  client.clear();
  vi.unstubAllGlobals();
});

describe('axes requests require current model metadata and actual household geography', () => {
  test.each([
    ['unrequested', metadataReducer(undefined, { type: 'init' }), /Wait for model information/],
    ['pending', { ...reviewMetadata, loading: true }, /Wait for model information/],
    ['failed', { ...reviewMetadata, error: 'Network failure' }, /Reload the page/],
    [
      'different country',
      { ...reviewMetadata, currentCountry: 'uk' },
      /Wait for model information/,
    ],
  ] as const)(
    'given %s metadata then charts explain readiness without starting a request',
    (_name, metadata, message) => {
      setup(metadata);
      expect(screen.getByText(message)).toBeInTheDocument();
      expect(fetchMock).not.toHaveBeenCalled();
    }
  );

  test.each([
    ['state-only', undefined, /choose national or local/],
    ['county without FIPS', COUNTY_SPM, /five-digit county/],
  ] as const)(
    'given an actual %s household then the axes POST stays blocked',
    async (_name, spm, message) => {
      savedHousehold = stateOnlyHousehold().withSPM(spm);
      setup(reviewMetadata);
      expect(await screen.findByText(message)).toBeInTheDocument();
      expect(axesRequests()).toHaveLength(0);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    }
  );

  test.each([NATIONAL_SPM, COUNTY_SPM])(
    'given valid saved %j settings then the axes request uses the actual inputs',
    async (spm) => {
      savedHousehold = stateOnlyHousehold()
        .withSPM(spm)
        .setGroupVariableAtYear(
          'households',
          'your household',
          'county_fips',
          SPM_TEST_YEAR,
          '06037'
        );
      setup(reviewMetadata);
      expect(await screen.findByText('Calculated earnings chart')).toBeInTheDocument();
      expect(axesRequests()).toHaveLength(1);
      const request = JSON.parse(axesRequests()[0][1].body);
      expect(request.spm).toEqual(spm);
      expect(request.household.households['your household'].county_fips[SPM_TEST_YEAR]).toBe(
        '06037'
      );
    }
  );

  test('given successfully resolved legacy metadata then an old household can calculate axes without canonical settings', async () => {
    setup({ ...RESOLVED_LEGACY_METADATA, variables: reviewMetadata.variables });
    expect(await screen.findByText('Calculated earnings chart')).toBeInTheDocument();
    expect(JSON.parse(axesRequests()[0][1].body)).not.toHaveProperty('spm');
  });

  test('given metadata resolves while the chart is open then a state-only household still cannot calculate axes', async () => {
    const store = setup(metadataReducer(undefined, fetchMetadataThunk.pending('request', 'us')));
    expect(fetchMock).not.toHaveBeenCalled();
    act(() => {
      store.dispatch(
        fetchMetadataThunk.fulfilled(
          { data: createMockApiPayload({ spm: CANONICAL_SPM_METADATA }), country: 'us' },
          'request',
          'us'
        )
      );
    });
    expect(await screen.findByText(/choose national or local/)).toBeInTheDocument();
    expect(axesRequests()).toHaveLength(0);
  });

  test('given the country changes while household loading is in flight then its response cannot start axes calculation', async () => {
    savedHousehold = stateOnlyHousehold().withSPM(NATIONAL_SPM);
    let resolveHousehold!: (response: Response) => void;
    fetchMock.mockImplementationOnce(
      () =>
        new Promise<Response>((resolve) => {
          resolveHousehold = resolve;
        })
    );
    const store = setup(reviewMetadata);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    act(() => {
      store.dispatch(fetchMetadataThunk.pending('uk-request', 'uk'));
    });
    expect(screen.getByText(/Wait for model information/)).toBeInTheDocument();
    await act(async () => {
      resolveHousehold(householdResponse());
    });
    expect(axesRequests()).toHaveLength(0);
  });
});

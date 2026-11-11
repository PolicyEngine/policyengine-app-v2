import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor } from '@test-utils';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import EarningsVariationSubPage from '@/pages/report-output/earnings-variation/EarningsVariationSubPage';
import MarginalTaxRatesSubPage from '@/pages/report-output/marginal-tax-rates/MarginalTaxRatesSubPage';
import metadataReducer from '@/reducers/metadataReducer';
import { householdErrorResponse } from '@/tests/fixtures/api/householdErrorMocks';
import {
  REPRODUCTION_HOUSEHOLDS,
  REPRODUCTION_POLICIES,
  REPRODUCTION_SIMULATIONS,
} from '@/tests/fixtures/pages/report-output/reproduce-in-python/householdSPMReproductionMocks';
import { OTHER_CALCULATION_ERROR, SPM_YEAR_ERROR } from '@/tests/fixtures/spm/reportErrorMocks';
import { SPM_TEST_YEAR } from '@/tests/fixtures/spm/spmMocks';
import { reviewMetadata, reviewOutput } from '@/tests/fixtures/spm/spmReviewMocks';

vi.mock('@/hooks/useReportYear', () => ({ useReportYear: () => SPM_TEST_YEAR }));
vi.mock('@/pages/report-output/earnings-variation/BaselineOnlyChart', () => ({
  default: () => null,
}));
vi.mock('@/pages/report-output/earnings-variation/BaselineAndReformChart', () => ({
  default: () => null,
}));

const fetchMock = vi.fn();
let client: QueryClient;

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retryDelay: 0 } } });
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => {
  client.clear();
  vi.unstubAllGlobals();
});

function axesRequests() {
  return fetchMock.mock.calls.filter(([url]) => url.endsWith('/calculate-full'));
}

function setup(
  Page: typeof EarningsVariationSubPage,
  errorRole: 'baseline' | 'reform',
  errorResponse: () => Response,
  pendingSibling?: Promise<Response>
) {
  fetchMock.mockImplementation(async (url: string, init: RequestInit) => {
    if (url.endsWith('/calculate-full')) {
      const role =
        JSON.parse(init.body as string).spm.geography_kind === 'national' ? 'baseline' : 'reform';
      return role === errorRole
        ? errorResponse()
        : (pendingSibling ??
            new Response(
              JSON.stringify({ status: 'ok', result: reviewOutput(role, true).householdData })
            ));
    }
    const household = REPRODUCTION_HOUSEHOLDS.find((item) => url.endsWith(`/${item.id}`))!;
    return new Response(
      JSON.stringify({
        status: 'ok',
        result: {
          id: household.id,
          country_id: household.countryId,
          household_json: household.toV1CreationPayload().data,
          spm: household.spm,
        },
      })
    );
  });
  const store = configureStore({
    reducer: { metadata: metadataReducer },
    preloadedState: { metadata: reviewMetadata },
  });
  render(
    <Provider store={store}>
      <QueryClientProvider client={client}>
        <Page
          baseline={reviewOutput('baseline')}
          reform={errorRole === 'reform' || pendingSibling ? reviewOutput('reform') : null}
          simulations={REPRODUCTION_SIMULATIONS}
          policies={REPRODUCTION_POLICIES}
        />
      </QueryClientProvider>
    </Provider>
  );
}

describe.each([
  ['earnings variation', EarningsVariationSubPage],
  ['marginal tax rates', MarginalTaxRatesSubPage],
] as const)('%s corrective API errors', (_name, Page) => {
  describe.each(['baseline', 'reform'] as const)('%s', (role) => {
    test('given a corrective error while the sibling calculation is pending then immediately displays recovery', async () => {
      let finishSibling!: (response: Response) => void;
      const pendingSibling = new Promise<Response>((resolve) => {
        finishSibling = resolve;
      });
      setup(Page, role, () => householdErrorResponse(SPM_YEAR_ERROR), pendingSibling);

      try {
        expect(await screen.findByRole('alert')).toHaveTextContent(SPM_YEAR_ERROR.code);
        expect(
          client
            .getQueryCache()
            .getAll()
            .some((query) => query.state.fetchStatus === 'fetching')
        ).toBe(true);
        expect(axesRequests()).toHaveLength(2);
      } finally {
        await act(async () => {
          finishSibling(
            new Response(
              JSON.stringify({
                status: 'ok',
                result: reviewOutput(role === 'baseline' ? 'reform' : 'baseline', true)
                  .householdData,
              })
            )
          );
        });
      }
    });

    test.each([400, 200])(
      'given HTTP %s with a typed SPM error then stops identical retries and displays correction guidance',
      async (status) => {
        setup(Page, role, () => householdErrorResponse(SPM_YEAR_ERROR, status));

        await waitFor(() =>
          expect(
            client
              .getQueryCache()
              .getAll()
              .some((query) => query.state.status === 'error')
          ).toBe(true)
        );
        expect(axesRequests()).toHaveLength(role === 'reform' ? 2 : 1);
        expect(await screen.findByRole('alert')).toHaveTextContent(SPM_YEAR_ERROR.message);
        expect(screen.getByRole('alert')).toHaveTextContent(SPM_YEAR_ERROR.code);
        expect(screen.getByRole('alert')).toHaveTextContent(
          `Open report setup and update the ${role} household`
        );
        expect(screen.getByRole('alert')).toHaveTextContent('before calculating again');
      }
    );
  });

  test('given a transient API failure then retains one retry and a readable error', async () => {
    setup(
      Page,
      'baseline',
      () =>
        new Response(JSON.stringify({ status: 'error', message: OTHER_CALCULATION_ERROR }), {
          status: 503,
        })
    );

    expect(await screen.findByText(new RegExp(OTHER_CALCULATION_ERROR))).toBeInTheDocument();
    expect(axesRequests()).toHaveLength(2);
    expect(screen.queryByText(/Open report setup and update/)).not.toBeInTheDocument();
  });
});

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderWithCountry, screen, within } from '@test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import StandardLayout from '@/components/StandardLayout';
import { setFlagshipShellEnabled } from '@/libs/featureFlags';
import { HouseholdReportOutput } from '@/pages/report-output/HouseholdReportOutput';
import { SPM_TEST_YEAR } from '@/tests/fixtures/spm/spmMocks';
import {
  reviewHousehold,
  reviewMetadata,
  reviewOutput,
  reviewSimulations,
} from '@/tests/fixtures/spm/spmReviewMocks';

vi.mock('react-redux', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-redux')>()),
  useSelector: (selector: (state: any) => unknown) => selector({ metadata: reviewMetadata }),
}));
vi.mock('@/hooks/useReportYear', () => ({ useReportYear: () => SPM_TEST_YEAR }));
vi.mock('@/hooks/household', () => ({
  useSimulationProgressDisplay: () => ({ displayProgress: 0, hasCalcStatus: false, message: null }),
}));
vi.mock('@/pages/report-output/useHouseholdCalculations', () => ({
  useHouseholdCalculations: () => ({}),
}));
// Keep global header and layout real; unrelated saved catalog and chart drawing are outside this test.
vi.mock('@/components/Sidebar', () => ({ default: () => <div>Saved ingredients</div> }));
vi.mock('@/components/household/HouseholdBreakdown', () => ({ default: () => null }));
vi.mock('@/pages/report-output/earnings-variation/BaselineAndReformChart', () => ({
  default: () => <div>Earnings chart</div>,
}));
vi.mock('@/api/reformStore', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/reformStore')>()),
  getReformStore: () => ({ findByUser: async () => [] }),
}));

const mockFetch = vi.fn();
let client: QueryClient;

describe('SPM point and axes receipts in app-owned report methodology', () => {
  beforeEach(() => {
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockReset();
    mockFetch.mockImplementation(async (url: string, options?: RequestInit) => {
      if (url.endsWith('/calculate-full')) {
        const request = JSON.parse(options!.body as string);
        const role = request.spm.geography_kind === 'national' ? 'baseline' : 'reform';
        const axes = reviewOutput(role, true);
        return new Response(
          JSON.stringify({
            status: 'ok',
            result: axes.householdData,
            spm_config: request.spm,
            spm_provenance: axes.spmProvenance,
          })
        );
      }
      const role = url.endsWith('review-baseline') ? 'baseline' : 'reform';
      return new Response(
        JSON.stringify({
          status: 'ok',
          result: {
            id: `review-${role}`,
            country_id: 'us',
            api_version: 'test-model',
            household_hash: 'test-hash',
            household_json: reviewHousehold
              .setGroupVariableAtYear(
                'households',
                'your household',
                'county_fips',
                SPM_TEST_YEAR,
                '06037'
              )
              .toV1CreationPayload().data,
            spm: { geography_kind: role === 'baseline' ? 'national' : 'county' },
          },
        })
      );
    });
  });
  afterEach(() => {
    client.clear();
    vi.unstubAllGlobals();
    setFlagshipShellEnabled(false);
  });

  test.each([
    ['earnings-variation', false],
    ['marginal-tax-rates', false],
    ['earnings-variation', true],
    ['marginal-tax-rates', true],
  ] as const)(
    'given %s in flagship=%s then displays separate returned axes receipts only within app results',
    async (activeView, flagship) => {
      setFlagshipShellEnabled(flagship);
      const simulations = reviewSimulations.map((simulation, index) => {
        const point = reviewOutput(index === 0 ? 'baseline' : 'reform');
        return {
          ...simulation,
          output: {
            status: 'ok' as const,
            result: point.householdData,
            spm_config: point.spmConfig,
            spm_provenance: point.spmProvenance,
          },
        };
      });
      const { container } = renderWithCountry(
        <QueryClientProvider client={client}>
          <StandardLayout>
            <HouseholdReportOutput
              report={{
                id: 'review-report',
                countryId: 'us',
                year: SPM_TEST_YEAR,
                apiVersion: null,
                simulationIds: simulations.map((s) => s.id!),
                status: 'complete',
                outputType: 'household',
                output: null,
              }}
              simulations={simulations}
              policies={simulations.map((s) => ({
                id: s.policyId!,
                countryId: 'us',
                parameters: [],
              }))}
              activeView={activeView}
              isLoading={false}
              error={null}
            />
          </StandardLayout>
        </QueryClientProvider>,
        'us'
      );
      const variation = await screen.findByRole('region', { name: 'SPM variation methodology' });
      const point = screen.getByRole('region', { name: 'SPM point calculation methodology' });
      expect(within(variation).getByText(/Baseline · Earnings variation/)).toBeVisible();
      expect(within(variation).getByText(/Reform · Earnings variation/)).toBeVisible();
      expect(variation).toHaveTextContent('test-baseline-axes');
      expect(variation).toHaveTextContent('test-reform-axes');
      expect(variation).not.toHaveTextContent('test-baseline-point');
      expect(point).toHaveTextContent('test-baseline-point');
      expect(point).toHaveTextContent('test-reform-point');
      expect(point).not.toHaveTextContent('test-baseline-axes');
      expect(within(point).getByText(/Baseline · Point calculation/)).toBeVisible();
      expect(within(point).getByText(/Reform · Point calculation/)).toBeVisible();
      expect(screen.getByRole('main')).toContainElement(variation);
      expect(screen.getByRole('main')).toContainElement(point);
      const chrome = flagship
        ? [screen.getByRole('button', { name: 'PolicyEngine' }).parentElement!]
        : Array.from(container.querySelectorAll('header, nav, aside, footer'));
      expect(chrome.length).toBeGreaterThan(0);
      chrome.forEach((element) => {
        expect(element).not.toHaveTextContent(
          /Supplemental Poverty Measure|SPM|test-.*-(point|axes)|forecast_sha256|composition_method/
        );
        expect(element).not.toContainElement(point);
        expect(element).not.toContainElement(variation);
      });
      const axesRequests = mockFetch.mock.calls.filter(([url]) => url.endsWith('/calculate-full'));
      expect(axesRequests).toHaveLength(2);
      expect(
        axesRequests.map(([, options]) => JSON.parse(options.body).spm.geography_kind).sort()
      ).toEqual(['county', 'national']);
      axesRequests.forEach(([, options]) =>
        expect(JSON.parse(options.body).household.axes).toBeDefined()
      );
    }
  );
});

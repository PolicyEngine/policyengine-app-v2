import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import HouseholdBreakdowns, {
  type HouseholdBreakdownSource,
  type HouseholdBreakdownView,
} from '@/components/flagship/report/household/HouseholdBreakdowns';
import {
  BASELINE_POLICY_ID,
  BASELINE_RESULT,
  CREATED_HOUSEHOLD_ID,
  HOUSEHOLD_YEAR,
  REFORM_POLICY_ID,
  REFORM_RESULT,
} from '@/tests/fixtures/libs/flagship/householdRunMocks';

vi.mock('@/api/policy', () => ({
  fetchPolicyById: async (_countryId: string, policyId: string) => ({
    id: policyId,
    country_id: 'us',
    api_version: '1',
    policy_json: {},
    label: null,
  }),
}));
// The model's parameters, loaded: the policies parse at once.
vi.mock('@/hooks/useParameterMetadata', () => ({
  useParameterMetadata: () => ({ parameters: {}, isReady: true }),
}));
// The v2 variation pages, tested on their own: stand-ins show the inputs
// the earnings variation is asked to offer.
vi.mock('@/pages/report-output/earnings-variation/EarningsVariationSubPage', () => ({
  default: ({ alsoOfferInputs }: { alsoOfferInputs?: string[] }) => (
    <div aria-label="Earnings variation">{(alsoOfferInputs ?? []).join(' ') || 'none'}</div>
  ),
}));
vi.mock('@/pages/report-output/marginal-tax-rates/MarginalTaxRatesSubPage', () => ({
  default: () => <div aria-label="Marginal tax rates" />,
}));

const SOURCE: HouseholdBreakdownSource = {
  countryId: 'us',
  year: HOUSEHOLD_YEAR,
  householdId: String(CREATED_HOUSEHOLD_ID),
  baselinePolicyId: BASELINE_POLICY_ID,
  reformPolicyId: REFORM_POLICY_ID,
  baseline: BASELINE_RESULT,
  reform: REFORM_RESULT,
  gains: true,
};

function renderBreakdowns(view: HouseholdBreakdownView, source: HouseholdBreakdownSource) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <HouseholdBreakdowns view={view} source={source} />
    </QueryClientProvider>
  );
}

describe('HouseholdBreakdowns household inputs (issue #1096)', () => {
  test("given the household's own amount inputs then the earnings variation offers them", async () => {
    renderBreakdowns('earnings-variation', { ...SOURCE, householdInputs: ['tip_income'] });

    expect(await screen.findByLabelText('Earnings variation')).toHaveTextContent('tip_income');
  });

  test('given no household inputs then the earnings variation offers none, as in the report section', async () => {
    renderBreakdowns('earnings-variation', SOURCE);

    expect(await screen.findByLabelText('Earnings variation')).toHaveTextContent('none');
  });
});

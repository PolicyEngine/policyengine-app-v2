import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
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
  fetchPolicyById: async (_country: string, policyId: string) => ({
    id: policyId,
    country_id: 'us',
    api_version: '1',
    policy_json: {},
    label: null,
  }),
}));
vi.mock('@/hooks/useParameterMetadata', () => ({
  useParameterMetadata: () => ({ parameters: {}, isReady: true }),
}));
// The v2 variation pages, tested on their own: stand-ins show whether the
// SPM methodology footnote under their chart is left out.
vi.mock('@/pages/report-output/earnings-variation/EarningsVariationSubPage', () => ({
  default: ({ hideSpmFootnote }: { hideSpmFootnote?: boolean }) => (
    <div aria-label="Earnings variation">{hideSpmFootnote ? 'footnote hidden' : 'footnote'}</div>
  ),
}));
vi.mock('@/pages/report-output/marginal-tax-rates/MarginalTaxRatesSubPage', () => ({
  default: ({ hideSpmFootnote }: { hideSpmFootnote?: boolean }) => (
    <div aria-label="Marginal tax rates">{hideSpmFootnote ? 'footnote hidden' : 'footnote'}</div>
  ),
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

function renderBreakdowns(view: HouseholdBreakdownView) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <HouseholdBreakdowns view={view} source={SOURCE} />
    </QueryClientProvider>
  );
}

describe('HouseholdBreakdowns SPM methodology', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test.each([
    ['earnings-variation', 'Earnings variation'],
    ['marginal-tax-rates', 'Marginal tax rates'],
  ] as const)(
    'given %s then the page keeps its SPM methodology footnote',
    async (view, pageName) => {
      renderBreakdowns(view);

      expect(await screen.findByLabelText(pageName)).toHaveTextContent(/^footnote$/);
    }
  );
});

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import HouseholdBreakdowns, {
  HouseholdVariationKeeper,
  type HouseholdBreakdownSource,
  type HouseholdBreakdownView,
  type HouseholdVariationSource,
} from '@/components/flagship/report/household/HouseholdBreakdowns';
import {
  BASELINE_POLICY_ID,
  BASELINE_RESULT,
  CREATED_HOUSEHOLD_ID,
  HOUSEHOLD_YEAR,
  REFORM_POLICY_ID,
  REFORM_RESULT,
} from '@/tests/fixtures/libs/flagship/householdRunMocks';

const mockFetchVariation = vi.fn();

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
// The v2 variation hook runs as it is; what it calls is a stand-in: the model
// is ready, the household loads, and calculate-full never answers.
vi.mock('@/utils/spmSelection', () => ({
  getModelMetadataError: () => null,
  getSPMSelectionError: () => null,
}));
vi.mock('@/api/household', () => ({
  fetchHouseholdById: async () => ({}),
}));
vi.mock('@/models/Household', async (importOriginal) => {
  const { Household } = await importOriginal<typeof import('@/models/Household')>();
  Household.fromV1Metadata = (() => ({ countryId: 'us', spm: undefined })) as any;
  return { Household };
});
vi.mock('@/utils/householdVariationAxes', () => ({
  buildHouseholdVariationAxes: () => ({}),
}));
vi.mock('@/api/householdVariation', () => ({
  fetchHouseholdVariationWithProvenance: (...args: unknown[]) => mockFetchVariation(...args),
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

const VARIATION: HouseholdVariationSource = { ...SOURCE, household: BASELINE_RESULT };

/** A household's card: the output open, or none (another household open), and the keeper. */
function renderCard(kept: boolean, opened: HouseholdBreakdownView | null = 'earnings-variation') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const Card = ({ view }: { view: HouseholdBreakdownView | null }) => (
    <QueryClientProvider client={queryClient}>
      {view && <HouseholdBreakdowns view={view} source={SOURCE} />}
      {kept && <HouseholdVariationKeeper source={VARIATION} />}
    </QueryClientProvider>
  );
  const card = render(<Card view={opened} />);
  return { show: (view: HouseholdBreakdownView | null) => card.rerender(<Card view={view} />) };
}

describe('HouseholdVariationKeeper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchVariation.mockImplementation(() => new Promise(() => {}));
  });

  test('given no output open then the variation runs, and opening one asks for nothing new', async () => {
    const { show } = renderCard(true, null);
    await waitFor(() => expect(mockFetchVariation).toHaveBeenCalledTimes(2));

    show('marginal-tax-rates');

    expect(
      await screen.findByText('Calculating marginal tax rates across earnings')
    ).toBeInTheDocument();
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(mockFetchVariation).toHaveBeenCalledTimes(2);
  });

  test('given the output closed and opened again then the variation is not asked for again', async () => {
    const { show } = renderCard(true);
    await waitFor(() => expect(mockFetchVariation).toHaveBeenCalledTimes(2));

    // Another household, then another tab, then back.
    show(null);
    show('net-income');
    show('marginal-tax-rates');

    expect(
      await screen.findByText('Calculating marginal tax rates across earnings')
    ).toBeInTheDocument();
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(mockFetchVariation).toHaveBeenCalledTimes(2);
  });

  test('given no keeper then closing the output cancels the run, and it starts again', async () => {
    const { show } = renderCard(false);
    await waitFor(() => expect(mockFetchVariation).toHaveBeenCalledTimes(2));

    show(null);
    show('earnings-variation');

    await waitFor(() => expect(mockFetchVariation).toHaveBeenCalledTimes(4));
  });
});

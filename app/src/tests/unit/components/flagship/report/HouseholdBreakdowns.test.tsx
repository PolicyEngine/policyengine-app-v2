import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent, waitFor } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import HouseholdBreakdowns, {
  toAppCalculationData,
  type HouseholdBreakdownSource,
  type HouseholdBreakdownView,
} from '@/components/flagship/report/household/HouseholdBreakdowns';
import { useReportYear } from '@/hooks/useReportYear';
import {
  BASELINE_POLICY_ID,
  BASELINE_RESULT,
  CREATED_HOUSEHOLD_ID,
  HOUSEHOLD_YEAR,
  REFORM_POLICY_ID,
  REFORM_RESULT,
} from '@/tests/fixtures/libs/flagship/householdRunMocks';

const mockFetchPolicyById = vi.fn();
const mockUseHouseholdVariation = vi.fn();

vi.mock('@/api/policy', () => ({
  fetchPolicyById: (...args: unknown[]) => mockFetchPolicyById(...args),
}));
// The model's parameters, loaded: the policies parse at once.
vi.mock('@/hooks/useParameterMetadata', () => ({
  useParameterMetadata: () => ({ parameters: {}, isReady: true }),
}));
// The variation request is the v2 hook's own, tested on its own: here it
// records what the v2 pages ask for, and stays loading.
vi.mock('@/hooks/useHouseholdVariation', () => ({
  useHouseholdVariation: (params: unknown) => mockUseHouseholdVariation(params),
}));
// The v2 net income tree, tested on its own: a stand-in shows what it reads.
vi.mock('@/components/household/HouseholdBreakdown', () => ({
  default: function HouseholdBreakdownStandIn({ baseline, reform }: any) {
    const year = useReportYear();
    return (
      <div aria-label="Net income tree">
        {`${baseline.id} · ${reform ? 'reform' : 'no reform'} · ${year} · ${
          baseline.householdData.households['your household'].household_net_income[year!]
        }`}
      </div>
    );
  },
}));

// jsdom has no layout, so the container hands each chart a fixed size.
vi.mock('recharts', async () => {
  const actual = await vi.importActual<typeof import('recharts')>('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactElement }) => (
      <div style={{ width: 700, height: 260 }}>
        {React.cloneElement(children, { width: 700, height: 260 } as any)}
      </div>
    ),
  };
});

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

function policyMetadata(policyId: string) {
  return { id: policyId, country_id: 'us', api_version: '1', policy_json: {}, label: null };
}

function renderBreakdowns(view: HouseholdBreakdownView, source = SOURCE) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const Harness = ({ current }: { current: HouseholdBreakdownView }) => (
    <QueryClientProvider client={queryClient}>
      <HouseholdBreakdowns view={current} source={source} />
    </QueryClientProvider>
  );
  const view$ = render(<Harness current={view} />);
  return {
    ...view$,
    show: (next: HouseholdBreakdownView) => view$.rerender(<Harness current={next} />),
  };
}

/** The variation requests the v2 pages made that would run. */
const enabledVariationCalls = () =>
  mockUseHouseholdVariation.mock.calls
    .map(([params]) => params)
    .filter((params: any) => params.enabled);

describe('HouseholdBreakdowns', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchPolicyById.mockImplementation(async (_country: string, policyId: string) =>
      policyMetadata(policyId)
    );
    mockUseHouseholdVariation.mockReturnValue({ data: undefined, isLoading: true, error: null });
  });

  test('given net income then the v2 tree reads the household in the report year', () => {
    renderBreakdowns('net-income');

    expect(screen.getByLabelText('Net income tree')).toHaveTextContent(
      `${CREATED_HOUSEHOLD_ID} · reform · ${HOUSEHOLD_YEAR} · 72000`
    );
    expect(screen.getByText('Click on any item to see its detailed breakdown')).toBeInTheDocument();
    // The tree reads the run: no policy and no variation is fetched.
    expect(mockFetchPolicyById).not.toHaveBeenCalled();
    expect(enabledVariationCalls()).toEqual([]);
  });

  test('given earnings variation then the v2 page asks for the household under each policy', async () => {
    renderBreakdowns('earnings-variation');

    expect(
      await screen.findByText('Calculating the household across earnings')
    ).toBeInTheDocument();
    expect(mockFetchPolicyById.mock.calls).toEqual([
      ['us', BASELINE_POLICY_ID],
      ['us', REFORM_POLICY_ID],
    ]);
    await waitFor(() => expect(enabledVariationCalls().length).toBeGreaterThanOrEqual(2));
    const asked = enabledVariationCalls().map((params: any) => [
      params.householdId,
      params.policyId,
      params.year,
      params.countryId,
    ]);
    expect(asked).toContainEqual([
      String(CREATED_HOUSEHOLD_ID),
      BASELINE_POLICY_ID,
      HOUSEHOLD_YEAR,
      'us',
    ]);
    expect(asked).toContainEqual([
      String(CREATED_HOUSEHOLD_ID),
      REFORM_POLICY_ID,
      HOUSEHOLD_YEAR,
      'us',
    ]);
  });

  test('given marginal tax rates after earnings variation then the policies are not fetched again', async () => {
    const { show } = renderBreakdowns('earnings-variation');
    await screen.findByText('Calculating the household across earnings');

    show('marginal-tax-rates');
    // The same run, as a bar, under the other output's name.
    expect(
      await screen.findByText('Calculating marginal tax rates across earnings')
    ).toBeInTheDocument();
    show('net-income');
    show('earnings-variation');

    expect(
      await screen.findByText('Calculating the household across earnings')
    ).toBeInTheDocument();
    expect(mockFetchPolicyById).toHaveBeenCalledTimes(2);
  });

  test('given one policy for both then the v2 page asks only for the baseline', async () => {
    renderBreakdowns('marginal-tax-rates', { ...SOURCE, reformPolicyId: BASELINE_POLICY_ID });

    await waitFor(() => expect(enabledVariationCalls().length).toBeGreaterThanOrEqual(1));
    expect(mockFetchPolicyById).toHaveBeenCalledTimes(1);
    expect(new Set(enabledVariationCalls().map((params: any) => params.policyId))).toEqual(
      new Set([BASELINE_POLICY_ID])
    );
  });

  test('given the policies fail to load then it says so, and trying again loads them', async () => {
    const user = userEvent.setup();
    mockFetchPolicyById.mockRejectedValueOnce(
      new Error(`Failed to fetch policy ${REFORM_POLICY_ID}`)
    );
    renderBreakdowns('earnings-variation');

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent("The report's policies could not be loaded");
    expect(enabledVariationCalls()).toEqual([]);

    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(
      await screen.findByText('Calculating the household across earnings')
    ).toBeInTheDocument();
  });
});

describe('toAppCalculationData', () => {
  test("given the API's snake-case groups then they take the app keys the v2 readers use", () => {
    const converted = toAppCalculationData({
      people: { you: { age: { 2026: 30 } } },
      households: { 'your household': { household_tax: { 2026: 1 } } },
      tax_units: { 'your tax unit': { income_tax: { 2026: 2 } } },
      spm_units: { 'your household': { snap: { 2026: 3 } } },
      marital_units: { 'your marital unit': {} },
      families: { 'your family': {} },
    } as any) as any;

    expect(Object.keys(converted).sort()).toEqual(
      ['families', 'households', 'maritalUnits', 'people', 'spmUnits', 'taxUnits'].sort()
    );
    expect(converted.taxUnits['your tax unit'].income_tax).toEqual({ 2026: 2 });
  });
});

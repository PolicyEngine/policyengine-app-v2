import { configureStore } from '@reduxjs/toolkit';
import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent, waitFor } from '@test-utils';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import HouseholdBreakdowns, {
  type HouseholdBreakdownSource,
  type HouseholdBreakdownView,
} from '@/components/flagship/report/household/HouseholdBreakdowns';
import metadataReducer from '@/reducers/metadataReducer';
import { TEST_CURRENT_LAW_ID } from '@/tests/fixtures/api/publicApi/modelCatalogMocks';
import {
  calculationOutput,
  US_SINGLE_PARENT_REFORM_SITUATION,
  V2_REFORM_POLICY_ID,
} from '@/tests/fixtures/api/v2HouseholdCalculationMocks';
import { testQueryClient } from '@/tests/fixtures/hooks/v3MetadataWrapper';
import {
  STORED_V2_HOUSEHOLD_ID,
  storedV2Household,
  US_SINGLE_PARENT_CALCULATED_IN_V1_NAMES,
  US_SINGLE_PARENT_V2_BODY,
  V2_CODEC_YEAR,
} from '@/tests/fixtures/models/household/v2DocumentCodecMocks';
import { HOUSEHOLD_VARIATION_POINT_COUNT } from '@/utils/householdVariationAxes';

/** v3 after the switch: V3_API_ROUTES is 'v2'. */
vi.mock('@/libs/flagship/v3ApiRoutes', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/libs/flagship/v3ApiRoutes')>()),
  V3_API_ROUTES: 'v2',
}));

const mockCalculate = vi.fn();
const mockFetchStoredHousehold = vi.fn();
const mockFetchPolicyById = vi.fn();
vi.mock('@/api/v2HouseholdCalculations', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/v2HouseholdCalculations')>()),
  calculateV2Household: (...args: unknown[]) => mockCalculate(...args),
}));
vi.mock('@/api/v2Households', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/v2Households')>()),
  fetchV2Household: (...args: unknown[]) => mockFetchStoredHousehold(...args),
}));
vi.mock('@/api/policy', () => ({
  fetchPolicyById: (...args: unknown[]) => mockFetchPolicyById(...args),
}));
// The variation pages, tested on their own: stand-ins show the variations they are given.
function variationStandIn(label: string) {
  return function VariationPageStandIn({ baselineVariation, reformVariation }: any) {
    return (
      <div aria-label={label}>
        {[
          Object.keys(baselineVariation?.householdData?.people ?? {}).join(', '),
          reformVariation ? 'with reform' : 'baseline only',
        ].join(' · ')}
      </div>
    );
  };
}
vi.mock('@/pages/report-output/earnings-variation/EarningsVariationSubPage', () => ({
  default: variationStandIn('Earnings variation'),
}));
vi.mock('@/pages/report-output/marginal-tax-rates/MarginalTaxRatesSubPage', () => ({
  default: variationStandIn('Marginal tax rates'),
}));

/** A US household run on the v2 routes: current law against a v2 reform policy. */
const V2_SOURCE: HouseholdBreakdownSource = {
  countryId: 'us',
  year: V2_CODEC_YEAR,
  householdId: STORED_V2_HOUSEHOLD_ID,
  baselinePolicyId: String(TEST_CURRENT_LAW_ID),
  reformPolicyId: V2_REFORM_POLICY_ID,
  baseline: US_SINGLE_PARENT_CALCULATED_IN_V1_NAMES as never,
  reform: US_SINGLE_PARENT_CALCULATED_IN_V1_NAMES as never,
  gains: true,
};

/** The earnings axis the single parent's variation sends: "you", the head, is first. */
const EXPECTED_AXES = [
  [
    {
      name: 'employment_income',
      period: V2_CODEC_YEAR,
      min: 0,
      max: 200000,
      count: HOUSEHOLD_VARIATION_POINT_COUNT,
      index: 0,
    },
  ],
];

function renderBreakdowns(view: HouseholdBreakdownView, source = V2_SOURCE) {
  const store = configureStore({
    reducer: { metadata: metadataReducer },
    preloadedState: {
      metadata: {
        ...metadataReducer(undefined, { type: 'test/init' }),
        currentLawId: TEST_CURRENT_LAW_ID,
      },
    },
  });
  const queryClient = testQueryClient();
  const Harness = ({ current }: { current: HouseholdBreakdownView }) => (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <HouseholdBreakdowns view={current} source={source} />
      </QueryClientProvider>
    </Provider>
  );
  const rendered = render(<Harness current={view} />);
  return {
    ...rendered,
    show: (next: HouseholdBreakdownView) => rendered.rerender(<Harness current={next} />),
  };
}

describe('HouseholdBreakdowns with v3 on the v2 routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchStoredHousehold.mockResolvedValue(
      storedV2Household('us', US_SINGLE_PARENT_V2_BODY.household_data)
    );
    mockCalculate.mockImplementation(async ({ policyId }: { policyId: string | null }) =>
      policyId === V2_REFORM_POLICY_ID
        ? calculationOutput({ household: US_SINGLE_PARENT_REFORM_SITUATION })
        : calculationOutput()
    );
  });

  test('given earnings variation then the stored household is calculated across earnings under each policy, with every variable', async () => {
    // When
    renderBreakdowns('earnings-variation');

    // Then
    await waitFor(() => expect(mockCalculate).toHaveBeenCalledTimes(2));
    expect(mockCalculate.mock.calls.map(([request]) => request)).toEqual([
      {
        countryId: 'us',
        householdId: STORED_V2_HOUSEHOLD_ID,
        policyId: null,
        axes: EXPECTED_AXES,
        addMissingVariables: true,
      },
      {
        countryId: 'us',
        householdId: STORED_V2_HOUSEHOLD_ID,
        policyId: V2_REFORM_POLICY_ID,
        axes: EXPECTED_AXES,
        addMissingVariables: true,
      },
    ]);
    expect(mockFetchPolicyById).not.toHaveBeenCalled();
  });

  test('given both variations then the earnings variation page shows them in the v1 names', async () => {
    // When
    renderBreakdowns('earnings-variation');

    // Then
    expect(await screen.findByLabelText('Earnings variation')).toHaveTextContent(
      'you, your first dependent · with reform'
    );
  });

  test('given the variation still calculating then its progress shows', async () => {
    // Given
    mockCalculate.mockReturnValue(new Promise(() => {}));

    // When
    renderBreakdowns('earnings-variation');

    // Then
    expect(
      await screen.findByText('Calculating the household across earnings')
    ).toBeInTheDocument();
  });

  test('given a variation that fails then it says why and can be asked for again', async () => {
    // Given
    const user = userEvent.setup();
    mockCalculate.mockRejectedValueOnce(new Error('The simulation service is unavailable.'));

    // When
    renderBreakdowns('earnings-variation');
    await user.click(await screen.findByRole('button', { name: /try again/i }));

    // Then
    expect(await screen.findByLabelText('Earnings variation')).toBeInTheDocument();
    expect(mockCalculate).toHaveBeenCalledTimes(3);
  });

  test('given marginal tax rates after the earnings variation then the same calculations serve both', async () => {
    // Given
    const { show } = renderBreakdowns('earnings-variation');
    await screen.findByLabelText('Earnings variation');

    // When
    show('marginal-tax-rates');

    // Then
    expect(await screen.findByLabelText('Marginal tax rates')).toHaveTextContent('with reform');
    expect(mockCalculate).toHaveBeenCalledTimes(2);
  });

  test('given a baseline-only household then only current law is calculated', async () => {
    // When
    renderBreakdowns('earnings-variation', {
      ...V2_SOURCE,
      reformPolicyId: V2_SOURCE.baselinePolicyId,
    });

    // Then
    expect(await screen.findByLabelText('Earnings variation')).toHaveTextContent('baseline only');
    expect(mockCalculate).toHaveBeenCalledTimes(1);
  });
});

import { configureStore } from '@reduxjs/toolkit';
import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { render, screen, userEvent, waitFor } from '@test-utils';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import HouseholdBreakdowns, {
  HouseholdVariationKeeper,
  type HouseholdBreakdownSource,
  type HouseholdBreakdownView,
  type HouseholdVariationSource,
} from '@/components/flagship/report/household/HouseholdBreakdowns';
import { v2StoredHouseholdKeys } from '@/libs/queryKeys';
import metadataReducer from '@/reducers/metadataReducer';
import { TEST_CURRENT_LAW_ID } from '@/tests/fixtures/api/publicApi/modelCatalogMocks';
import {
  calculationItem,
  calculationOutput,
  US_SINGLE_PARENT_REFORM_SITUATION,
  V2_CALCULATION_IDS,
  V2_REFORM_POLICY_ID,
} from '@/tests/fixtures/api/v2HouseholdCalculationMocks';
import { testQueryClient } from '@/tests/fixtures/hooks/v3MetadataWrapper';
import {
  STORED_V2_HOUSEHOLD_ID,
  storedV2Household,
  US_SINGLE_PARENT,
  US_SINGLE_PARENT_CALCULATED_IN_V1_NAMES,
  US_SINGLE_PARENT_V2_BODY,
  V2_CODEC_YEAR,
} from '@/tests/fixtures/models/household/v2DocumentCodecMocks';
import type { HouseholdCalculationData } from '@/types/calculation/household';
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
  return function VariationPageStandIn({
    baselineVariation,
    reformVariation,
  }: {
    baselineVariation?: { householdData?: { people?: Record<string, unknown> } } | null;
    reformVariation?: unknown;
  }) {
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

const STORED_SINGLE_PARENT = storedV2Household('us', US_SINGLE_PARENT_V2_BODY.household_data);

/** A US household run on the v2 routes: current law against a v2 reform policy. */
const V2_SOURCE: HouseholdBreakdownSource = {
  countryId: 'us',
  year: V2_CODEC_YEAR,
  householdId: STORED_V2_HOUSEHOLD_ID,
  baselinePolicyId: String(TEST_CURRENT_LAW_ID),
  reformPolicyId: V2_REFORM_POLICY_ID,
  baseline: US_SINGLE_PARENT_CALCULATED_IN_V1_NAMES as unknown as HouseholdCalculationData,
  reform: US_SINGLE_PARENT_CALCULATED_IN_V1_NAMES as unknown as HouseholdCalculationData,
  gains: true,
};

/** The same household's variation, as the Household tab starts it once the household is stored. */
const V2_VARIATION_SOURCE: HouseholdVariationSource = {
  countryId: 'us',
  year: V2_CODEC_YEAR,
  householdId: STORED_V2_HOUSEHOLD_ID,
  baselinePolicyId: String(TEST_CURRENT_LAW_ID),
  reformPolicyId: V2_REFORM_POLICY_ID,
  household: US_SINGLE_PARENT.toV1CreationPayload().data as unknown as HouseholdCalculationData,
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

function storeWithCurrentLaw() {
  return configureStore({
    reducer: { metadata: metadataReducer },
    preloadedState: {
      metadata: {
        ...metadataReducer(undefined, { type: 'test/init' }),
        currentLawId: TEST_CURRENT_LAW_ID,
      },
    },
  });
}

function renderBreakdowns(
  view: HouseholdBreakdownView,
  source = V2_SOURCE,
  queryClient: QueryClient = testQueryClient()
) {
  const store = storeWithCurrentLaw();
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

function renderKeeper(queryClient: QueryClient) {
  return render(
    <Provider store={storeWithCurrentLaw()}>
      <QueryClientProvider client={queryClient}>
        <HouseholdVariationKeeper source={V2_VARIATION_SOURCE} />
      </QueryClientProvider>
    </Provider>
  );
}

describe('HouseholdBreakdowns with v3 on the v2 routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchStoredHousehold.mockResolvedValue(STORED_SINGLE_PARENT);
    mockCalculate.mockImplementation(async ({ policyId }: { policyId: string | null }) =>
      policyId === V2_REFORM_POLICY_ID
        ? calculationItem({
            calculation_id: V2_CALCULATION_IDS.REFORM,
            policy_id: V2_REFORM_POLICY_ID,
            result: calculationOutput({ household: US_SINGLE_PARENT_REFORM_SITUATION }),
          })
        : calculationItem()
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

  test('given the stored household already in the session then it is not read again', async () => {
    // Given
    const queryClient = testQueryClient();
    queryClient.setQueryData(
      v2StoredHouseholdKeys.byId('us', STORED_V2_HOUSEHOLD_ID),
      STORED_SINGLE_PARENT
    );

    // When
    renderBreakdowns('earnings-variation', V2_SOURCE, queryClient);

    // Then
    expect(await screen.findByLabelText('Earnings variation')).toBeInTheDocument();
    expect(mockFetchStoredHousehold).not.toHaveBeenCalled();
  });

  test('given the variation kept in the background since the household was stored then opening a chart calculates nothing more', async () => {
    // Given
    const queryClient = testQueryClient();
    renderKeeper(queryClient);
    await waitFor(() => expect(mockCalculate).toHaveBeenCalledTimes(2));

    // When
    renderBreakdowns('earnings-variation', V2_SOURCE, queryClient);

    // Then
    expect(await screen.findByLabelText('Earnings variation')).toHaveTextContent('with reform');
    expect(mockCalculate).toHaveBeenCalledTimes(2);
    expect(mockFetchPolicyById).not.toHaveBeenCalled();
  });
});

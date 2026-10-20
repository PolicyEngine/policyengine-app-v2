import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent, waitFor, within } from '@test-utils';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { Household } from '@/models/Household';
import HouseholdReportPage from '@/pages/flagship/HouseholdReport.page';
import metadataReducer from '@/reducers/metadataReducer';
import {
  EDITED_FAMILY_HOUSEHOLD,
  FAMILY_HOUSEHOLD,
  FAMILY_LABEL,
  routeRequests,
  SAVED_FAMILY,
  SAVED_HOUSEHOLD_IDS,
  userHouseholdItem,
  V2_HOUSEHOLD_IDS,
  v2HouseholdItem,
} from '@/tests/fixtures/api/savedHouseholdMocks';
import {
  createTestApiContext,
  errorResponse,
  itemResponse,
  pageResponse,
} from '@/tests/fixtures/api/v2UserMocks';
import {
  BASELINE_POLICY_ID,
  BASELINE_RESULT,
  BASELINE_RUN_BUNDLE,
  calculationResponse,
  CREATED_HOUSEHOLD_ID,
  HOUSEHOLD_YEAR,
  REFORM_POLICY_ID,
  REFORM_RESULT,
  REFORM_RUN_BUNDLE,
  UK_BASELINE_RESULT,
} from '@/tests/fixtures/libs/flagship/householdRunMocks';

/**
 * v3's standalone household report: one household under a baseline and,
 * optionally, a reform (issues #498, #1095, #1096). No route renders it
 * before v3 moves to v2.
 */

const mockCreateHousehold = vi.fn();
const mockFetchHouseholdCalculation = vi.fn();
const mockSavedWork = vi.fn();

vi.mock('@/api/household', () => ({
  createHousehold: (...args: unknown[]) => mockCreateHousehold(...args),
}));
vi.mock('@/api/householdCalculation', () => ({
  fetchHouseholdCalculationWithBundle: async (...args: unknown[]) => {
    const [, , policyId] = args as [string, string, string];
    return calculationResponse(await mockFetchHouseholdCalculation(...args), {
      policyengine_bundle:
        policyId === BASELINE_POLICY_ID ? BASELINE_RUN_BUNDLE : REFORM_RUN_BUNDLE,
    });
  },
}));
vi.mock('@/api/policy', () => ({
  fetchPolicyById: async (countryId: string, policyId: string) => ({
    id: policyId,
    country_id: countryId,
    api_version: '1',
    label: null,
    policy_json: {},
  }),
}));
vi.mock('@/hooks/useParameterMetadata', () => ({
  useParameterMetadata: () => ({ parameters: {}, isReady: true }),
}));
vi.mock('@/hooks/useFlagshipStores', () => ({
  useV3SavedWork: () => mockSavedWork(),
}));
// The household builder, tested on its own: a stand-in shows the household
// and makes the builder's own changes.
vi.mock('@/components/household/HouseholdBuilderForm', () => ({
  default: ({
    household,
    year,
    onChange,
    hideSpmGeography,
  }: {
    household: Household;
    year: string;
    onChange: (household: Household) => void;
    hideSpmGeography?: boolean;
  }) => {
    const { maritalStatus, numChildren } = household.deriveBuilderComposition(year);
    return (
      <div aria-label="Household builder" data-spm-choice={hideSpmGeography ? 'hidden' : 'shown'}>
        <span>{`${maritalStatus} · ${numChildren}`}</span>
        <button
          type="button"
          onClick={() =>
            onChange(household.setPersonVariableAtYear('you', 'tip_income', year, 6000))
          }
        >
          Add tip income
        </button>
      </div>
    );
  },
}));
// The v2 breakdowns, tested on their own: a stand-in shows what each is given.
vi.mock('@/components/flagship/report/household/HouseholdBreakdowns', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@/components/flagship/report/household/HouseholdBreakdowns')
  >()),
  default: ({ view, source }: any) => (
    <div aria-label="Breakdown" data-inputs={(source.householdInputs ?? []).join(' ')}>
      {[view, source.baselinePolicyId, source.reformPolicyId].join(' · ')}
    </div>
  ),
}));
vi.mock('@/utils/HouseholdValidation', () => ({
  HouseholdValidation: { isReadyForSimulation: () => ({ isValid: true, errors: [] }) },
}));

/** The years the model's metadata lists for the report. */
const MODEL_YEARS = [2026, 2027];
/** A model year after the households' own (they are built in 2026). */
const LATER_MODEL_YEAR = '2027';

function renderReport(props: Partial<React.ComponentProps<typeof HouseholdReportPage>> = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const initialMetadata = metadataReducer(undefined, { type: 'test/init' });
  const store = configureStore({
    reducer: { metadata: metadataReducer },
    preloadedState: {
      metadata: {
        ...initialMetadata,
        economyOptions: {
          ...initialMetadata.economyOptions,
          time_period: MODEL_YEARS.map((year) => ({ name: year, label: String(year) })),
        },
      },
    },
  });
  render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <HouseholdReportPage
          countryId="us"
          year={HOUSEHOLD_YEAR}
          baselinePolicyId={BASELINE_POLICY_ID}
          {...props}
        />
      </QueryClientProvider>
    </Provider>,
    props.countryId ?? 'us'
  );
}

async function calculate() {
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Calculate' }));
  return user;
}

describe('HouseholdReportPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSavedWork.mockReturnValue({ account: null, scope: 'browser' });
    mockCreateHousehold.mockResolvedValue({ result: { household_id: CREATED_HOUSEHOLD_ID } });
    mockFetchHouseholdCalculation.mockImplementation(
      async (_country: string, _household: string, policyId: string) =>
        policyId === BASELINE_POLICY_ID ? BASELINE_RESULT : REFORM_RESULT
    );
  });

  test('given a household and a reform then the change in its net income is reported', async () => {
    renderReport({ household: FAMILY_HOUSEHOLD, reformPolicyId: REFORM_POLICY_ID });

    await calculate();

    const result = await screen.findByRole('region', { name: 'Household impact' });
    expect(
      within(result).getByRole('group', { name: 'Change in annual net income' })
    ).toHaveTextContent('+$1,000');
    expect(mockFetchHouseholdCalculation.mock.calls.map((call) => call[2])).toEqual([
      BASELINE_POLICY_ID,
      REFORM_POLICY_ID,
    ]);
  });

  test("given no reform then it reports the household's net income under the baseline alone", async () => {
    renderReport({ household: FAMILY_HOUSEHOLD });

    await calculate();

    const result = await screen.findByRole('region', { name: 'Household net income' });
    expect(within(result).getByRole('group', { name: 'Annual net income' })).toHaveTextContent(
      '$72,000'
    );
    expect(screen.queryByText('Change in annual net income')).not.toBeInTheDocument();
    expect(mockFetchHouseholdCalculation).toHaveBeenCalledTimes(1);
  });

  test('given a baseline-only result then its tabs open the breakdowns under the baseline alone', async () => {
    renderReport({ household: FAMILY_HOUSEHOLD });
    const user = await calculate();
    const result = await screen.findByRole('region', { name: 'Household net income' });

    await user.click(within(result).getByRole('tab', { name: 'Marginal tax rates' }));

    expect(within(result).getByLabelText('Breakdown')).toHaveTextContent(
      `marginal-tax-rates · ${BASELINE_POLICY_ID} · ${BASELINE_POLICY_ID}`
    );
  });

  test("given a result then the household's inputs, the policy and Reproduce in Python follow it", async () => {
    renderReport({ household: FAMILY_HOUSEHOLD, reformPolicyId: REFORM_POLICY_ID });

    await calculate();

    const inputs = await screen.findByRole('region', { name: 'Household inputs' });
    expect(inputs).toHaveTextContent('Population information');
    expect(await screen.findByRole('region', { name: 'Policy' })).toHaveTextContent(
      'Policy information'
    );
    const reproduce = await screen.findByRole('region', { name: 'Reproduce in Python' });
    expect(within(reproduce).getByRole('heading', { name: 'Baseline simulation' })).toBeVisible();
    expect(within(reproduce).getByRole('heading', { name: 'Reform simulation' })).toBeVisible();
    // The DataFrame code of issue #1095 is offered here.
    expect(
      within(reproduce).getByRole('switch', { name: 'Include a pandas DataFrame' })
    ).toBeInTheDocument();
    // Each block is pinned to the .py bundle its own calculation reported.
    expect(reproduce).toHaveTextContent(
      `Resolved with policyengine.py ${BASELINE_RUN_BUNDLE.policyengine_version}`
    );
    expect(reproduce).toHaveTextContent(`policyengine-us ${REFORM_RUN_BUNDLE.model_version}`);
  });

  test('given a failed calculation then trying again calculates the same household again', async () => {
    mockFetchHouseholdCalculation.mockRejectedValueOnce(new Error('Household calculation failed'));
    renderReport({ household: FAMILY_HOUSEHOLD });
    const user = await calculate();

    await user.click(await screen.findByRole('button', { name: 'Try again' }));

    const result = await screen.findByRole('region', { name: 'Household net income' });
    expect(within(result).getByRole('group', { name: 'Annual net income' })).toHaveTextContent(
      '$72,000'
    );
    expect(mockFetchHouseholdCalculation).toHaveBeenCalledTimes(2);
  });

  test.each([
    ['a household', { household: FAMILY_HOUSEHOLD }],
    ['a saved household', { savedHousehold: SAVED_FAMILY }],
  ])(
    "given %s from another year then the report opens it in the report's year",
    async (_opening, openingProps) => {
      renderReport({ ...openingProps, year: LATER_MODEL_YEAR });

      await calculate();

      await waitFor(() => expect(mockCreateHousehold).toHaveBeenCalledTimes(1));
      expect(mockCreateHousehold.mock.calls[0][0].data.people.you.age).toEqual({
        [LATER_MODEL_YEAR]: 30,
      });
    }
  );

  test("given another year then the household's inputs move to it before it runs (issue #498)", async () => {
    const user = userEvent.setup();
    renderReport({ household: FAMILY_HOUSEHOLD });

    await user.selectOptions(screen.getByRole('combobox', { name: 'Year' }), '2027');
    await user.click(screen.getByRole('button', { name: 'Calculate' }));

    await waitFor(() => expect(mockCreateHousehold).toHaveBeenCalledTimes(1));
    expect(mockCreateHousehold.mock.calls[0][0].data.people.you.age).toEqual({ 2027: 30 });
  });

  test('given a household with tip income then the earnings variation offers it (issue #1096)', async () => {
    const user = userEvent.setup();
    renderReport({ household: FAMILY_HOUSEHOLD });

    await user.click(screen.getByRole('button', { name: 'Add tip income' }));
    await user.click(screen.getByRole('button', { name: 'Calculate' }));
    const result = await screen.findByRole('region', { name: 'Household net income' });
    await user.click(within(result).getByRole('tab', { name: 'Varying earnings' }));

    expect(within(result).getByLabelText('Breakdown')).toHaveAttribute('data-inputs', 'tip_income');
  });

  test('given a US household then the builder offers the SPM geography choice', () => {
    renderReport({ household: FAMILY_HOUSEHOLD });

    expect(screen.getByRole('generic', { name: 'Household builder' })).toHaveAttribute(
      'data-spm-choice',
      'shown'
    );
  });

  test('given a UK household and no reform then it runs in the UK and reads in pounds', async () => {
    mockFetchHouseholdCalculation.mockResolvedValue(UK_BASELINE_RESULT);
    renderReport({ countryId: 'uk' });

    await calculate();

    const result = await screen.findByRole('region', { name: 'Household net income' });
    expect(within(result).getByRole('group', { name: 'Annual net income' })).toHaveTextContent(
      '£24,940'
    );
    expect(mockFetchHouseholdCalculation.mock.calls[0][0]).toBe('uk');
  });

  describe('saved households', () => {
    /** Signed in, with the family saved; `moreRoutes` answers the saves a test makes. */
    function signedInWithFamily(moreRoutes: Parameters<typeof routeRequests>[1] = {}) {
      const { fetchMock, context } = createTestApiContext('us');
      mockSavedWork.mockReturnValue({ account: context, scope: 'account:test' });
      routeRequests(fetchMock, {
        'GET /v2/user-households': () => pageResponse([userHouseholdItem()]),
        [`GET /v2/households/${V2_HOUSEHOLD_IDS.FAMILY}`]: () =>
          itemResponse(v2HouseholdItem(FAMILY_HOUSEHOLD, V2_HOUSEHOLD_IDS.FAMILY)),
        ...moreRoutes,
      });
    }

    test('given a new household saved then the report says it is saved', async () => {
      const user = userEvent.setup();
      signedInWithFamily({
        'POST /v2/households': () =>
          itemResponse(v2HouseholdItem(FAMILY_HOUSEHOLD, V2_HOUSEHOLD_IDS.FAMILY), 201),
        'POST /v2/user-households': () => itemResponse(userHouseholdItem(), 201),
      });
      renderReport({ household: FAMILY_HOUSEHOLD });

      await user.type(screen.getByRole('textbox', { name: 'Household label' }), FAMILY_LABEL);
      await user.click(screen.getByRole('button', { name: 'Save household' }));

      expect(await screen.findByText('Saved')).toHaveAttribute('role', 'status');
      // The stored household reads back with the same content: nothing is left to save.
      expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
    });

    test('given an edit whose earlier version cannot be removed then the report says both are saved', async () => {
      const user = userEvent.setup();
      signedInWithFamily({
        'POST /v2/households': () =>
          itemResponse(
            v2HouseholdItem(EDITED_FAMILY_HOUSEHOLD, V2_HOUSEHOLD_IDS.EDITED_FAMILY),
            201
          ),
        'POST /v2/user-households': () =>
          itemResponse(
            userHouseholdItem({
              id: SAVED_HOUSEHOLD_IDS.REPLACEMENT,
              household_id: V2_HOUSEHOLD_IDS.EDITED_FAMILY,
            }),
            201
          ),
        [`DELETE /v2/user-households/${SAVED_HOUSEHOLD_IDS.FAMILY}`]: () =>
          errorResponse(503, 'Saved household deletion is unavailable'),
      });
      renderReport({ savedHousehold: SAVED_FAMILY });

      await user.click(screen.getByRole('button', { name: 'Add tip income' }));
      await user.click(screen.getByRole('button', { name: 'Save changes' }));

      expect(await screen.findByRole('alert')).toHaveTextContent('both are saved now');
    });

    test('given a saved household chosen then the builder holds it, and saving edits it', async () => {
      const user = userEvent.setup();
      signedInWithFamily();
      renderReport();

      expect(screen.getByRole('generic', { name: 'Household builder' })).toHaveTextContent(
        'single · 0'
      );
      await user.click(await screen.findByRole('button', { name: new RegExp(FAMILY_LABEL) }));

      expect(screen.getByRole('generic', { name: 'Household builder' })).toHaveTextContent(
        'married · 2'
      );
      expect(screen.getByRole('textbox', { name: 'Household label' })).toHaveValue(FAMILY_LABEL);
      expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
    });

    test('given the report opened from a saved household then it is the one the save form edits', () => {
      signedInWithFamily();
      renderReport({ savedHousehold: SAVED_FAMILY });

      expect(screen.getByRole('generic', { name: 'Household builder' })).toHaveTextContent(
        'married · 2'
      );
      expect(screen.getByRole('textbox', { name: 'Household label' })).toHaveValue(FAMILY_LABEL);
    });

    test('given no accounts then saved households are not offered', () => {
      renderReport({ household: FAMILY_HOUSEHOLD });

      expect(
        screen.getAllByText('Saved households are not available here.').length
      ).toBeGreaterThan(0);
    });
  });
});

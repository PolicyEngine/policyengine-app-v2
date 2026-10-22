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
  RETIRED_HOUSEHOLD,
  RETIRED_LABEL,
  routeRequests,
  SAVED_FAMILY,
  SAVED_HOUSEHOLD_IDS,
  storedV2HouseholdItem,
  TWO_YEAR_FAMILY_HOUSEHOLD,
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
import {
  LATER_MODEL_YEAR,
  MODEL_YEARS,
  NOT_READY_TO_RUN,
  policyMetadata,
  READY_TO_RUN,
  REFORM_PARAMETER,
  REFORM_PARAMETER_METADATA,
  REFORM_POLICY_JSON,
} from '@/tests/fixtures/pages/flagship/householdReportPageMocks';

/**
 * v3's standalone household report: one household under a baseline and,
 * optionally, a reform (issues #498, #1095, #1096). No route renders it
 * before v3 moves to the Public API's v2 routes.
 */

const mockCreateHousehold = vi.fn();
const mockFetchHouseholdCalculation = vi.fn();
const mockFetchPolicyById = vi.fn();
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
  fetchPolicyById: (...args: unknown[]) => mockFetchPolicyById(...args),
}));

vi.mock('@/hooks/useParameterMetadata', () => ({
  useParameterMetadata: () => ({ parameters: REFORM_PARAMETER_METADATA, isReady: true }),
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
    disabled,
  }: {
    household: Household;
    year: string;
    onChange: (household: Household) => void;
    disabled?: boolean;
  }) => {
    const { maritalStatus, numChildren } = household.deriveBuilderComposition(year);
    return (
      <div aria-label="Household builder" data-disabled={String(!!disabled)}>
        <span>{`${maritalStatus} · ${numChildren}`}</span>
        <button
          type="button"
          onClick={() =>
            onChange(household.setPersonVariableAtYear('you', 'tip_income', year, 6000))
          }
        >
          Add tip income
        </button>
        <button
          type="button"
          onClick={() => onChange(household.withBuilderMaritalStatus(year, 'single'))}
        >
          Make single
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
const mockHouseholdValidation = vi.fn();
vi.mock('@/utils/HouseholdValidation', () => ({
  HouseholdValidation: { isReadyForSimulation: () => mockHouseholdValidation() },
}));

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

/** The household the report sent to the Public API's v1 household route. */
const createdPayload = (callIndex = 0) => mockCreateHousehold.mock.calls[callIndex][0];

describe('HouseholdReportPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHouseholdValidation.mockReturnValue(READY_TO_RUN);
    mockSavedWork.mockReturnValue({ account: null, scope: 'browser' });
    mockFetchPolicyById.mockImplementation(async (countryId: string, policyId: string) =>
      policyMetadata(countryId, policyId)
    );
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

  test('given the reform is the baseline then the report is baseline-only', async () => {
    renderReport({ household: FAMILY_HOUSEHOLD, reformPolicyId: BASELINE_POLICY_ID });

    await calculate();

    expect(await screen.findByRole('region', { name: 'Household net income' })).toBeVisible();
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
    expect(
      within(reproduce).getByRole('region', { name: 'Baseline simulation' })
    ).toHaveTextContent(`policyengine-us ${BASELINE_RUN_BUNDLE.model_version}`);
    expect(within(reproduce).getByRole('region', { name: 'Reform simulation' })).toHaveTextContent(
      `policyengine-us ${REFORM_RUN_BUNDLE.model_version}`
    );
  });

  test('given both policies then each Python block reproduces its own policy', async () => {
    mockFetchHouseholdCalculation.mockResolvedValue(UK_BASELINE_RESULT);
    mockFetchPolicyById.mockImplementation(async (countryId: string, policyId: string) =>
      policyMetadata(countryId, policyId, policyId === REFORM_POLICY_ID ? REFORM_POLICY_JSON : {})
    );
    renderReport({ countryId: 'uk', reformPolicyId: REFORM_POLICY_ID });

    await calculate();

    const reformBlock = await screen.findByRole('region', { name: 'Reform simulation' });
    await waitFor(() => expect(reformBlock).toHaveTextContent(REFORM_PARAMETER));
    expect(screen.getByRole('region', { name: 'Baseline simulation' })).not.toHaveTextContent(
      REFORM_PARAMETER
    );
  });

  test("given the baseline's policy failing to load then no Python block is given the reform's policy", async () => {
    mockFetchHouseholdCalculation.mockResolvedValue(UK_BASELINE_RESULT);
    mockFetchPolicyById.mockImplementation(async (countryId: string, policyId: string) => {
      if (policyId === BASELINE_POLICY_ID) {
        throw new Error('Policy could not be loaded');
      }
      return policyMetadata(countryId, policyId, REFORM_POLICY_JSON);
    });
    renderReport({ countryId: 'uk', reformPolicyId: REFORM_POLICY_ID });

    await calculate();

    expect(await screen.findByText("The report's policies could not be loaded")).toBeVisible();
    const baselineBlock = screen.getByRole('region', { name: 'Baseline simulation' });
    expect(baselineBlock).toHaveTextContent(
      "Load this simulation's household and policy to generate its code."
    );
    expect(baselineBlock).not.toHaveTextContent(REFORM_PARAMETER);
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

  test('given a failed calculation and the household then edited so it cannot run, trying again asks for the household that failed', async () => {
    mockFetchHouseholdCalculation.mockRejectedValueOnce(new Error('Household calculation failed'));
    renderReport({ household: FAMILY_HOUSEHOLD });
    const user = await calculate();
    await screen.findByRole('button', { name: 'Try again' });

    mockHouseholdValidation.mockReturnValue(NOT_READY_TO_RUN);
    await user.click(screen.getByRole('button', { name: 'Add tip income' }));
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    await screen.findByRole('region', { name: 'Household net income' });
    expect(mockCreateHousehold).toHaveBeenCalledTimes(2);
    expect(
      mockCreateHousehold.mock.calls.map((call) => call[0].data.people.you.tip_income)
    ).toEqual([undefined, undefined]);
  });

  test('given the household calculated and unchanged then there is nothing new to calculate', async () => {
    renderReport({ household: FAMILY_HOUSEHOLD });
    const user = await calculate();
    await screen.findByRole('region', { name: 'Household net income' });

    expect(screen.getByRole('button', { name: 'Calculate' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Add tip income' }));

    expect(screen.getByRole('button', { name: 'Calculate' })).toBeEnabled();
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
      expect(createdPayload().data.people.you.age).toEqual({ [LATER_MODEL_YEAR]: 30 });
      expect(screen.getByRole('combobox', { name: 'Year' })).toHaveValue(LATER_MODEL_YEAR);
    }
  );

  test('given the household edited after its result then the result still describes the household calculated', async () => {
    renderReport({ household: FAMILY_HOUSEHOLD });
    const user = await calculate();
    const result = await screen.findByRole('region', { name: 'Household net income' });

    await user.click(screen.getByRole('button', { name: 'Make single' }));

    expect(result).toHaveTextContent('Married · 2 children');
    expect(result).not.toHaveTextContent('Single');
  });

  test("given another year then the household's inputs move to it before it runs (issue #498)", async () => {
    const user = userEvent.setup();
    renderReport({ household: FAMILY_HOUSEHOLD });

    expect(
      within(screen.getByRole('combobox', { name: 'Year' }))
        .getAllByRole('option')
        .map((option) => option.textContent)
    ).toEqual(['2026', '2027']);
    await user.selectOptions(screen.getByRole('combobox', { name: 'Year' }), LATER_MODEL_YEAR);
    await user.click(screen.getByRole('button', { name: 'Calculate' }));

    await waitFor(() => expect(mockCreateHousehold).toHaveBeenCalledTimes(1));
    expect(createdPayload().data.people.you.age).toEqual({ [LATER_MODEL_YEAR]: 30 });
  });

  test('given another year after a result then the result clears until the next calculation', async () => {
    renderReport({ household: FAMILY_HOUSEHOLD });
    const user = await calculate();
    await screen.findByRole('region', { name: 'Household net income' });

    await user.selectOptions(screen.getByRole('combobox', { name: 'Year' }), LATER_MODEL_YEAR);

    expect(screen.queryByRole('region', { name: 'Household net income' })).not.toBeInTheDocument();
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

  test('given a new US household then it starts on national poverty thresholds', async () => {
    renderReport();

    await calculate();

    await waitFor(() => expect(mockCreateHousehold).toHaveBeenCalledTimes(1));
    expect(createdPayload().spm).toEqual({ geography_kind: 'national' });
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
    expect(createdPayload().spm).toBeUndefined();
  });

  describe('saved households', () => {
    /** Signed in, with the family saved; `moreRoutes` answers the saves a test makes. */
    function signedInWithFamily(moreRoutes: Parameters<typeof routeRequests>[1] = {}) {
      const { fetchMock, context } = createTestApiContext('us');
      mockSavedWork.mockReturnValue({ account: context, scope: 'account:test' });
      return routeRequests(fetchMock, {
        'GET /v2/user-households': () => pageResponse([userHouseholdItem()]),
        [`GET /v2/households/${V2_HOUSEHOLD_IDS.FAMILY}`]: () =>
          itemResponse(v2HouseholdItem(FAMILY_HOUSEHOLD, V2_HOUSEHOLD_IDS.FAMILY)),
        ...moreRoutes,
      });
    }

    test('given a new household saved then the report says it is saved, with nothing left to save', async () => {
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
      // The stored household reads back with the same content.
      expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
    });

    test('given a saved household chosen while a save is still running then the finished save does not take its place', async () => {
      const user = userEvent.setup();
      let finishStoring: (response: Response) => void = () => {};
      const requests = signedInWithFamily({
        'POST /v2/households': () =>
          new Promise<Response>((resolve) => {
            finishStoring = resolve;
          }),
        'POST /v2/user-households': () =>
          itemResponse(
            userHouseholdItem({
              id: SAVED_HOUSEHOLD_IDS.RETIRED,
              household_id: V2_HOUSEHOLD_IDS.RETIRED,
              name: RETIRED_LABEL,
            }),
            201
          ),
      });
      renderReport({ household: RETIRED_HOUSEHOLD });
      await user.type(screen.getByRole('textbox', { name: 'Household label' }), RETIRED_LABEL);
      await user.click(screen.getByRole('button', { name: 'Save household' }));

      await user.click(await screen.findByRole('button', { name: new RegExp(FAMILY_LABEL) }));
      finishStoring(
        itemResponse(v2HouseholdItem(RETIRED_HOUSEHOLD, V2_HOUSEHOLD_IDS.RETIRED), 201)
      );

      // The finished save's request for its saved row has gone out and been answered.
      await waitFor(() =>
        expect(
          requests.some(
            (request) => request.method === 'POST' && request.path === '/v2/user-households'
          )
        ).toBe(true)
      );
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(screen.getByRole('button', { name: new RegExp(FAMILY_LABEL) })).toHaveAttribute(
        'aria-pressed',
        'true'
      );
      expect(screen.getByRole('textbox', { name: 'Household label' })).toHaveValue(FAMILY_LABEL);
      expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
    });

    test('given an edited saved household saved then it points at the edit and keeps its id', async () => {
      const user = userEvent.setup();
      const requests = signedInWithFamily({
        'POST /v2/households': (request) =>
          itemResponse(storedV2HouseholdItem(request.body, V2_HOUSEHOLD_IDS.EDITED_FAMILY), 201),
        [`PATCH /v2/user-households/${SAVED_HOUSEHOLD_IDS.FAMILY}`]: () =>
          itemResponse(userHouseholdItem({ household_id: V2_HOUSEHOLD_IDS.EDITED_FAMILY })),
      });
      renderReport({ savedHousehold: SAVED_FAMILY });

      await user.click(screen.getByRole('button', { name: 'Add tip income' }));
      await user.click(screen.getByRole('button', { name: 'Save changes' }));

      expect(await screen.findByText('Saved')).toHaveAttribute('role', 'status');
      expect(requests.find((request) => request.method === 'PATCH')?.path).toBe(
        `/v2/user-households/${SAVED_HOUSEHOLD_IDS.FAMILY}`
      );
      expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
    });

    test('given the edit cannot be saved then the report says the changes were not saved', async () => {
      const user = userEvent.setup();
      signedInWithFamily({
        'POST /v2/households': () =>
          itemResponse(
            v2HouseholdItem(EDITED_FAMILY_HOUSEHOLD, V2_HOUSEHOLD_IDS.EDITED_FAMILY),
            201
          ),
        [`PATCH /v2/user-households/${SAVED_HOUSEHOLD_IDS.FAMILY}`]: () =>
          errorResponse(503, 'Saved work is temporarily unavailable.'),
      });
      renderReport({ savedHousehold: SAVED_FAMILY });

      await user.click(screen.getByRole('button', { name: 'Add tip income' }));
      await user.click(screen.getByRole('button', { name: 'Save changes' }));

      expect(await screen.findByRole('alert')).toHaveTextContent('Your changes were not saved');
    });

    test('given a saved household chosen then the builder holds it, and saving edits it', async () => {
      const user = userEvent.setup();
      signedInWithFamily();
      renderReport();

      expect(screen.getByLabelText('Household builder')).toHaveTextContent('single · 0');
      await user.click(await screen.findByRole('button', { name: new RegExp(FAMILY_LABEL) }));

      expect(screen.getByLabelText('Household builder')).toHaveTextContent('married · 2');
      expect(screen.getByRole('textbox', { name: 'Household label' })).toHaveValue(FAMILY_LABEL);
      expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
    });

    test('given a saved household with inputs in two years then the picker opens it in its own year, saying why', async () => {
      const user = userEvent.setup();
      signedInWithFamily({
        'GET /v2/user-households': () =>
          pageResponse([userHouseholdItem({ household_id: V2_HOUSEHOLD_IDS.TWO_YEAR_FAMILY })]),
        [`GET /v2/households/${V2_HOUSEHOLD_IDS.TWO_YEAR_FAMILY}`]: () =>
          itemResponse(
            v2HouseholdItem(TWO_YEAR_FAMILY_HOUSEHOLD, V2_HOUSEHOLD_IDS.TWO_YEAR_FAMILY)
          ),
      });
      renderReport({ year: LATER_MODEL_YEAR });

      await user.click(await screen.findByRole('button', { name: new RegExp(FAMILY_LABEL) }));

      expect(screen.getByLabelText('Household builder')).toHaveTextContent('married · 2');
      expect(screen.getByRole('combobox', { name: 'Year' })).toHaveValue(HOUSEHOLD_YEAR);
      expect(screen.getByRole('alert')).toHaveTextContent('inputs for multiple years');
    });

    test('given a calculation running then no saved household can be opened, as the builder and year cannot change', async () => {
      const user = userEvent.setup();
      signedInWithFamily();
      mockFetchHouseholdCalculation.mockReturnValue(new Promise(() => {}));
      renderReport({ household: RETIRED_HOUSEHOLD });
      const familyOption = await screen.findByRole('button', { name: new RegExp(FAMILY_LABEL) });

      await user.click(screen.getByRole('button', { name: 'Calculate' }));

      await waitFor(() => expect(familyOption).toBeDisabled());
      expect(screen.getByRole('combobox', { name: 'Year' })).toBeDisabled();
    });

    test('given the report opened from a saved household then it is the one the save form edits', () => {
      signedInWithFamily();
      renderReport({ savedHousehold: SAVED_FAMILY });

      expect(screen.getByLabelText('Household builder')).toHaveTextContent('married · 2');
      expect(screen.getByRole('textbox', { name: 'Household label' })).toHaveValue(FAMILY_LABEL);
    });

    test('given no accounts then saved households are not offered', () => {
      renderReport({ household: FAMILY_HOUSEHOLD });

      expect(screen.getAllByText('Saved households are not available here.')).toHaveLength(2);
      expect(screen.queryByRole('textbox', { name: 'Household label' })).not.toBeInTheDocument();
    });
  });
});

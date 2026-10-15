import {
  focusManager,
  onlineManager,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { act, render, screen, userEvent, waitFor, within } from '@test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import HouseholdImpactSection from '@/components/flagship/report/household/HouseholdImpactSection';
import {
  BASELINE_POLICY_ID,
  BASELINE_RESULT,
  CREATED_HOUSEHOLD_ID,
  HOUSEHOLD_YEAR,
  LOW_EARNER_BASELINE_RESULT,
  LOW_EARNER_REFORM_RESULT,
  REFORM_POLICY_ID,
  REFORM_RESULT,
  REFORM_RESULT_LOSS,
} from '@/tests/fixtures/libs/flagship/householdRunMocks';

const mockCreateHousehold = vi.fn();
const mockFetchHouseholdCalculation = vi.fn();

vi.mock('@/api/household', () => ({
  createHousehold: (...args: unknown[]) => mockCreateHousehold(...args),
}));
vi.mock('@/api/householdCalculation', () => ({
  fetchHouseholdCalculation: (...args: unknown[]) => mockFetchHouseholdCalculation(...args),
}));

// The household builder is the v2 builder, tested on its own: here a stand-in
// makes the same calls it makes, so the section's own work is what is tested.
vi.mock('@/components/household/HouseholdBuilderForm', () => ({
  default: ({
    household,
    year,
    maritalStatus,
    numChildren,
    onChange,
    onMaritalStatusChange,
    onNumChildrenChange,
  }: any) => (
    <div aria-label="Household builder">
      <span>{`${maritalStatus} · ${numChildren}`}</span>
      <span data-testid="state">
        {String(
          (Object.values(household.householdData.households ?? {})[0] as any)?.state_name?.[year] ??
            ''
        )}
      </span>
      <button type="button" onClick={() => onMaritalStatusChange('married')}>
        Married
      </button>
      <button type="button" onClick={() => onNumChildrenChange(2)}>
        Two children
      </button>
      <button
        type="button"
        onClick={() => {
          const { partnerKey } = household.deriveBuilderComposition(year);
          onChange(household.setPersonVariableAtYear(partnerKey, 'employment_income', year, 20000));
        }}
      >
        Partner earns 20000
      </button>
    </div>
  ),
}));
vi.mock('@/utils/HouseholdValidation', () => ({
  HouseholdValidation: { isReadyForSimulation: () => ({ isValid: true, errors: [] }) },
}));

function renderSection({
  region,
  countryId = 'us',
  added = true,
}: { region?: string; countryId?: string; added?: boolean } = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const view = render(
    <QueryClientProvider client={queryClient}>
      <HouseholdImpactSection
        countryId={countryId}
        year={HOUSEHOLD_YEAR}
        region={region}
        baselinePolicyId={BASELINE_POLICY_ID}
        reformPolicyId={REFORM_POLICY_ID}
      />
    </QueryClientProvider>
  );
  // Most tests start from a household already added.
  if (added && countryId === 'us') {
    act(() => screen.getByRole('button', { name: 'Add a household' }).click());
  }
  return view;
}

/** Each policy's calculated household, from the reform's result. */
function calculateWith(reformResult: typeof REFORM_RESULT) {
  mockFetchHouseholdCalculation.mockImplementation(
    async (_country: string, _household: string, policyId: string) =>
      policyId === BASELINE_POLICY_ID ? BASELINE_RESULT : reformResult
  );
}

describe('HouseholdImpactSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateHousehold.mockResolvedValue({ result: { household_id: CREATED_HOUSEHOLD_ID } });
    calculateWith(REFORM_RESULT);
    // Radix Select scrolls its options and captures the pointer, which jsdom lacks.
    Element.prototype.scrollIntoView ??= vi.fn();
    Element.prototype.hasPointerCapture ??= vi.fn(() => false);
  });

  afterEach(() => {
    focusManager.setFocused(undefined);
    onlineManager.setOnline(true);
  });

  test('given the section then only a button to add a household shows', () => {
    renderSection({ added: false });

    expect(screen.getByRole('button', { name: 'Add a household' })).toBeInTheDocument();
    expect(screen.queryByRole('generic', { name: 'Household builder' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Calculate' })).not.toBeInTheDocument();
    expect(mockCreateHousehold).not.toHaveBeenCalled();
  });

  test('given Add a household then the builder opens with nothing filled in', async () => {
    renderSection({ region: 'state/ny' });

    expect(screen.getByRole('generic', { name: 'Household builder' })).toHaveTextContent(
      'single · 0'
    );
    // No state, even on a state's report, and no earnings: the reader sets them.
    expect(screen.getByTestId('state')).toHaveTextContent('');
    expect(await screen.findByRole('button', { name: 'Calculate' })).toBeEnabled();
    expect(mockCreateHousehold).not.toHaveBeenCalled();
    expect(screen.queryByRole('region', { name: 'Household impact' })).not.toBeInTheDocument();
  });

  test('given the new household then it earns nothing, on national poverty thresholds', async () => {
    const user = userEvent.setup();
    renderSection();

    await user.click(await screen.findByRole('button', { name: 'Calculate' }));

    await waitFor(() => expect(mockCreateHousehold).toHaveBeenCalledTimes(1));
    const sent = mockCreateHousehold.mock.calls[0][0];
    expect(sent.data.people.you.employment_income).toEqual({ [HOUSEHOLD_YEAR]: 0 });
    expect(JSON.stringify(sent)).toContain('national');
  });

  test('given Calculate then the run shows its progress, then the change in net income', async () => {
    const user = userEvent.setup();
    let finish!: () => void;
    mockFetchHouseholdCalculation.mockImplementation(
      (_country: string, _household: string, policyId: string) =>
        new Promise((resolve) => {
          const result = policyId === BASELINE_POLICY_ID ? BASELINE_RESULT : REFORM_RESULT;
          const previous = finish;
          finish = () => {
            previous?.();
            resolve(result);
          };
        })
    );
    renderSection();

    await user.click(screen.getByRole('button', { name: 'Calculate' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Calculating this household');
    expect(screen.getByRole('button', { name: 'Calculate' })).toBeDisabled();

    finish();

    const result = await screen.findByRole('region', { name: 'Household impact' });
    const headline = within(result).getByRole('group', { name: 'Change in annual net income' });
    expect(headline).toHaveTextContent('+$1,000');
    expect(headline).toHaveTextContent('$72,000 → $73,000 (+1.4%)');
    expect(result).toHaveTextContent('Single · no children · 2026');
  });

  test('given a result then its taxes, benefits and credits that change are listed', async () => {
    const user = userEvent.setup();
    renderSection();

    await user.click(screen.getByRole('button', { name: 'Calculate' }));

    const parts = await screen.findByRole('table', { name: 'Taxes and benefits' });
    const federal = within(parts).getByRole('row', { name: /Federal income tax/ });
    expect(federal).toHaveTextContent('$3,000$2,000−$1,000');
    expect(within(parts).getByRole('row', { name: /Net income/ })).toHaveTextContent(
      '$72,000$73,000+$1,000'
    );
    expect(within(parts).queryByRole('row', { name: /State income tax/ })).not.toBeInTheDocument();
    const credits = screen.getByRole('table', { name: 'Credits and benefits' });
    expect(within(credits).getByRole('row', { name: /Child Tax Credit/ })).toHaveTextContent(
      '+$1,000'
    );
    // The household on screen is the one in the form: nothing to run again.
    expect(screen.getByRole('button', { name: 'Calculate' })).toBeDisabled();
  });

  test('given a loss then it reads with a minus sign', async () => {
    const user = userEvent.setup();
    calculateWith(REFORM_RESULT_LOSS);
    renderSection();

    await user.click(screen.getByRole('button', { name: 'Calculate' }));

    const result = await screen.findByRole('region', { name: 'Household impact' });
    expect(
      within(result).getByRole('group', { name: 'Change in annual net income' })
    ).toHaveTextContent('−$900');
    expect(within(result).getByRole('row', { name: /SNAP/ })).toHaveTextContent('−$300');
  });

  test('given a reform that leaves the household alone then it says so', async () => {
    const user = userEvent.setup();
    calculateWith(BASELINE_RESULT);
    renderSection();

    await user.click(screen.getByRole('button', { name: 'Calculate' }));

    expect(
      await screen.findByText("No change in this household's taxes or benefits.")
    ).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  test('given a bigger credit the household cannot claim then no credit change is shown', async () => {
    const user = userEvent.setup();
    mockFetchHouseholdCalculation.mockImplementation(
      async (_country: string, _household: string, policyId: string) =>
        policyId === BASELINE_POLICY_ID ? LOW_EARNER_BASELINE_RESULT : LOW_EARNER_REFORM_RESULT
    );
    renderSection();

    await user.click(screen.getByRole('button', { name: 'Calculate' }));

    expect(
      await screen.findByText("No change in this household's taxes or benefits.")
    ).toBeInTheDocument();
    expect(screen.queryByRole('table', { name: 'Credits and benefits' })).not.toBeInTheDocument();
  });

  test('given a married couple with children then the builder household is sent', async () => {
    const user = userEvent.setup();
    renderSection();

    await user.click(screen.getByRole('button', { name: 'Married' }));
    await user.click(screen.getByRole('button', { name: 'Two children' }));
    await user.click(screen.getByRole('button', { name: 'Partner earns 20000' }));
    await user.click(await screen.findByRole('button', { name: 'Calculate' }));

    await waitFor(() => expect(mockCreateHousehold).toHaveBeenCalledTimes(1));
    const people = mockCreateHousehold.mock.calls[0][0].data.people;
    expect(people['your partner'].employment_income).toEqual({ [HOUSEHOLD_YEAR]: 20000 });
    expect(people['your first dependent']).toBeDefined();
    expect(people['your second dependent']).toBeDefined();
  });

  test('given a failed run then it says so, and trying again shows the result', async () => {
    const user = userEvent.setup();
    mockFetchHouseholdCalculation.mockRejectedValueOnce(new Error('Household calculation failed'));
    renderSection();

    await user.click(screen.getByRole('button', { name: 'Calculate' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('This household could not be calculated');
    expect(alert).toHaveTextContent('Household calculation failed');

    await user.click(within(alert).getByRole('button', { name: 'Try again' }));

    expect(await screen.findByRole('region', { name: 'Household impact' })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  test('given a failed run then refocusing the page or reconnecting does not run it again', async () => {
    const user = userEvent.setup();
    mockFetchHouseholdCalculation.mockRejectedValueOnce(new Error('Household calculation failed'));
    renderSection();

    await user.click(screen.getByRole('button', { name: 'Calculate' }));
    await screen.findByRole('alert');

    // The query client refetches on focus and reconnect a tick later.
    await act(async () => {
      focusManager.setFocused(false);
      focusManager.setFocused(true);
      onlineManager.setOnline(false);
      onlineManager.setOnline(true);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(mockCreateHousehold).toHaveBeenCalledTimes(1);
  });

  test.each([
    [
      'a timeout',
      new Error('Household calculation timed out after 50 seconds (client-side timeout)'),
      'The calculation took too long.',
    ],
    ['a network failure', new TypeError('Failed to fetch'), 'Could not reach PolicyEngine.'],
  ])('given %s then the alert reads in plain words', async (_kind, error, message) => {
    const user = userEvent.setup();
    mockFetchHouseholdCalculation.mockRejectedValueOnce(error);
    renderSection();

    await user.click(screen.getByRole('button', { name: 'Calculate' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(message);
    expect(alert).not.toHaveTextContent(error.message);
  });

  test('given a report outside the US then no household form shows', () => {
    renderSection({ countryId: 'uk' });

    expect(screen.getByText('Household impacts are available for US reports.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Calculate' })).not.toBeInTheDocument();
  });
});

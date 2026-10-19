import { StrictMode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, userEvent, waitFor, within } from '@test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import HouseholdImpactSection, {
  nonDefaultInputCount,
} from '@/components/flagship/report/household/HouseholdImpactSection';
import { Household } from '@/models/Household';
import {
  BASELINE_POLICY_ID,
  BASELINE_RESULT,
  CREATED_HOUSEHOLD_ID,
  HOUSEHOLD_YEAR,
  REFORM_POLICY_ID,
  REFORM_RESULT,
} from '@/tests/fixtures/libs/flagship/householdRunMocks';

const mockCreateHousehold = vi.fn();
const mockFetchHouseholdCalculation = vi.fn();

vi.mock('@/api/household', () => ({
  createHousehold: (...args: unknown[]) => mockCreateHousehold(...args),
}));
vi.mock('@/api/householdCalculation', () => ({
  fetchHouseholdCalculation: (...args: unknown[]) => mockFetchHouseholdCalculation(...args),
}));

/** An input value no event may carry. */
const PARTNER_EARNINGS = 23456;

// The builder is tested on its own: a stand-in makes the calls it makes,
// including its picker callbacks.
vi.mock('@/components/household/HouseholdBuilderForm', () => ({
  default: ({
    household,
    year,
    onChange,
    onMaritalStatusChange,
    onVariablePickerOpen,
    onVariableAdd,
  }: any) => (
    <div aria-label="Household builder">
      <button type="button" onClick={() => onMaritalStatusChange('married')}>
        Married
      </button>
      <button
        type="button"
        onClick={() => {
          const { partnerKey } = household.deriveBuilderComposition(year);
          onChange(
            household.setPersonVariableAtYear(
              partnerKey,
              'employment_income',
              year,
              PARTNER_EARNINGS
            )
          );
        }}
      >
        Partner earns
      </button>
      <button type="button" onClick={() => onVariablePickerOpen('person')}>
        Open picker
      </button>
      <button
        type="button"
        onClick={() =>
          onVariableAdd({ variable: 'pre_subsidy_rent', source: 'featured', entity: 'group' })
        }
      >
        Add rent
      </button>
    </div>
  ),
}));
vi.mock('@/components/flagship/report/household/HouseholdBreakdowns', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@/components/flagship/report/household/HouseholdBreakdowns')
  >()),
  default: ({ view }: any) => <div aria-label="Breakdown">{view}</div>,
}));
vi.mock('@/utils/HouseholdValidation', () => ({
  HouseholdValidation: { isReadyForSimulation: () => ({ isValid: true, errors: [] }) },
}));

const gtag = vi.fn();

/** The events sent, by name, with their parameters. */
const sent = (name: string) =>
  gtag.mock.calls.filter((call) => call[0] === 'event' && call[1] === name).map((call) => call[2]);

function renderSection({ strict = false }: { strict?: boolean } = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const section = (
    <QueryClientProvider client={queryClient}>
      <HouseholdImpactSection
        countryId="us"
        year={HOUSEHOLD_YEAR}
        baselinePolicyId={BASELINE_POLICY_ID}
        reformPolicyId={REFORM_POLICY_ID}
      />
    </QueryClientProvider>
  );
  return render(strict ? <StrictMode>{section}</StrictMode> : section);
}

describe('HouseholdImpactSection analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.gtag = gtag;
    mockCreateHousehold.mockResolvedValue({ result: { household_id: CREATED_HOUSEHOLD_ID } });
    mockFetchHouseholdCalculation.mockImplementation(
      async (_country: string, _household: string, policyId: string) =>
        policyId === BASELINE_POLICY_ID ? BASELINE_RESULT : REFORM_RESULT
    );
  });

  afterEach(() => {
    delete window.gtag;
  });

  test('given households added and removed then each action sends one event with the count', async () => {
    const user = userEvent.setup();
    renderSection();

    await user.click(screen.getByRole('button', { name: 'Add a household' }));
    await user.click(screen.getByRole('button', { name: 'Add another household' }));
    await user.click(screen.getByRole('button', { name: 'Remove household 1' }));

    expect(sent('household_added')).toEqual([
      { country_id: 'us', household_count: 1 },
      { country_id: 'us', household_count: 2 },
    ]);
    expect(sent('household_removed')).toEqual([{ country_id: 'us', household_count: 1 }]);
  });

  test('given a household calculated then one event sends its counts and duration, no values', async () => {
    const user = userEvent.setup();
    renderSection();
    act(() => screen.getByRole('button', { name: 'Add a household' }).click());
    await user.click(screen.getByRole('button', { name: 'Married' }));
    await user.click(screen.getByRole('button', { name: 'Partner earns' }));

    await user.click(screen.getByRole('button', { name: 'Calculate' }));
    await screen.findByRole('region', { name: 'Household impact' });

    await waitFor(() => expect(sent('household_calculated')).toHaveLength(1));
    expect(sent('household_calculated')[0]).toEqual({
      country_id: 'us',
      household_count: 1,
      people_count: 2,
      non_default_inputs: 1,
      duration_ms: expect.any(Number),
      success: true,
    });
    expect(JSON.stringify(gtag.mock.calls)).not.toContain(String(PARTNER_EARNINGS));
  });

  test('given strict mode then adding and calculating still send one event each', async () => {
    const user = userEvent.setup();
    renderSection({ strict: true });

    await user.click(screen.getByRole('button', { name: 'Add a household' }));
    await user.click(screen.getByRole('button', { name: 'Calculate' }));
    await screen.findByRole('region', { name: 'Household impact' });

    await waitFor(() => expect(sent('household_calculated')).toHaveLength(1));
    expect(sent('household_added')).toHaveLength(1);
  });

  test('given a failed run then the failure sends a category, and Try again sends a retry and a new run', async () => {
    const user = userEvent.setup();
    mockFetchHouseholdCalculation.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    renderSection();
    act(() => screen.getByRole('button', { name: 'Add a household' }).click());

    await user.click(screen.getByRole('button', { name: 'Calculate' }));
    const alert = await screen.findByRole('alert');
    await waitFor(() => expect(sent('household_calculated')).toHaveLength(1));
    expect(sent('household_calculated')[0]).toMatchObject({
      success: false,
      error_category: 'network',
    });
    // The category only: never the message.
    expect(JSON.stringify(gtag.mock.calls)).not.toContain('Failed to fetch');

    await user.click(within(alert).getByRole('button', { name: 'Try again' }));
    await screen.findByRole('region', { name: 'Household impact' });

    expect(sent('household_calculation_retried')).toEqual([{ country_id: 'us' }]);
    await waitFor(() => expect(sent('household_calculated')).toHaveLength(2));
    expect(sent('household_calculated')[1]).toMatchObject({ success: true });
  });

  test('given an output tab opened then one event names it, and the open tab sends nothing', async () => {
    const user = userEvent.setup();
    renderSection();
    act(() => screen.getByRole('button', { name: 'Add a household' }).click());
    await user.click(screen.getByRole('button', { name: 'Calculate' }));
    const result = await screen.findByRole('region', { name: 'Household impact' });

    await user.click(within(result).getByRole('tab', { name: 'Summary' }));
    await user.click(within(result).getByRole('tab', { name: 'Varying earnings' }));
    await user.click(within(result).getByRole('tab', { name: 'Marginal tax rates' }));

    expect(sent('household_output_viewed')).toEqual([
      { country_id: 'us', tab: 'varying_earnings' },
      { country_id: 'us', tab: 'marginal_tax_rates' },
    ]);
  });

  test('given the picker opened and an input added then each sends one event', async () => {
    const user = userEvent.setup();
    renderSection();
    act(() => screen.getByRole('button', { name: 'Add a household' }).click());

    await user.click(screen.getByRole('button', { name: 'Open picker' }));
    await user.click(screen.getByRole('button', { name: 'Add rent' }));

    expect(sent('household_picker_opened')).toEqual([{ country_id: 'us', entity: 'person' }]);
    expect(sent('household_variable_added')).toEqual([
      { country_id: 'us', variable: 'pre_subsidy_rent', source: 'featured', entity: 'group' },
    ]);
  });
});

describe('nonDefaultInputCount', () => {
  test('given a new household then it counts nothing', () => {
    const household = Household.starter('us', HOUSEHOLD_YEAR).withSPM({
      geography_kind: 'national',
    });

    expect(nonDefaultInputCount(household, 'us', HOUSEHOLD_YEAR)).toBe(0);
  });

  test("given a partner added then the partner's own age is not counted, earnings are", () => {
    const married = Household.starter('us', HOUSEHOLD_YEAR).withBuilderMaritalStatus(
      HOUSEHOLD_YEAR,
      'married'
    );
    const { partnerKey } = married.deriveBuilderComposition(HOUSEHOLD_YEAR);

    expect(nonDefaultInputCount(married, 'us', HOUSEHOLD_YEAR)).toBe(0);
    expect(
      nonDefaultInputCount(
        married.setPersonVariableAtYear(partnerKey!, 'employment_income', HOUSEHOLD_YEAR, 1000),
        'us',
        HOUSEHOLD_YEAR
      )
    ).toBe(1);
  });
});

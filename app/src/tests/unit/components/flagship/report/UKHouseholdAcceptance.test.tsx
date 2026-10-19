import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent, waitFor, within } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import HouseholdImpactSection from '@/components/flagship/report/household/HouseholdImpactSection';
import type { Household } from '@/models/Household';
import {
  BASELINE_POLICY_ID,
  calculationResponse,
  CREATED_HOUSEHOLD_ID,
  HOUSEHOLD_YEAR,
  ISSUE_358_HOUSEHOLD,
  REFORM_POLICY_ID,
  UK_BASELINE_RESULT,
  UK_COUPLE_WITH_BENEFIT_UNIT_INPUT,
  UK_REFORM_RESULT,
} from '@/tests/fixtures/libs/flagship/householdRunMocks';

/**
 * Acceptance checks for UK households in v3's report section, from issues
 * #358 (a UK household the v1 API once failed to calculate) and #562 (the
 * UK household checklist: several people, an input on the benefit unit,
 * the report's policies, the whole run). Saving and reusing a household
 * (#562's second item) belongs to the standalone household report.
 */

const mockCreateHousehold = vi.fn();
const mockFetchHouseholdCalculation = vi.fn();

vi.mock('@/api/household', () => ({
  createHousehold: (...args: unknown[]) => mockCreateHousehold(...args),
}));
vi.mock('@/api/householdCalculation', () => ({
  fetchHouseholdCalculationWithBundle: async (...args: unknown[]) =>
    calculationResponse(await mockFetchHouseholdCalculation(...args)),
}));
// The household builder, tested on its own: a stand-in hands the section a
// household the builder can make, as its onChange does.
vi.mock('@/components/household/HouseholdBuilderForm', async () => {
  const fixtures = await import('@/tests/fixtures/libs/flagship/householdRunMocks');
  return {
    default: ({ onChange }: { onChange: (household: Household) => void }) => (
      <div aria-label="Household builder">
        <button type="button" onClick={() => onChange(fixtures.ISSUE_358_HOUSEHOLD)}>
          Describe issue 358&apos;s household
        </button>
        <button type="button" onClick={() => onChange(fixtures.UK_COUPLE_WITH_BENEFIT_UNIT_INPUT)}>
          Describe a couple with a child
        </button>
      </div>
    ),
  };
});
vi.mock('@/utils/HouseholdValidation', () => ({
  HouseholdValidation: { isReadyForSimulation: () => ({ isValid: true, errors: [] }) },
}));

async function calculateUKHousehold(describe: string) {
  const user = userEvent.setup();
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <HouseholdImpactSection
        countryId="uk"
        year={HOUSEHOLD_YEAR}
        baselinePolicyId={BASELINE_POLICY_ID}
        reformPolicyId={REFORM_POLICY_ID}
      />
    </QueryClientProvider>,
    'uk'
  );
  await user.click(screen.getByRole('button', { name: 'Add a household' }));
  await user.click(screen.getByRole('button', { name: describe }));
  await user.click(screen.getByRole('button', { name: 'Calculate' }));
  await waitFor(() => expect(mockCreateHousehold).toHaveBeenCalledTimes(1));
  return mockCreateHousehold.mock.calls[0][0];
}

describe('UK households in the report section (issues #358 and #562)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateHousehold.mockResolvedValue({ result: { household_id: CREATED_HOUSEHOLD_ID } });
    mockFetchHouseholdCalculation.mockImplementation(
      async (_country: string, _household: string, policyId: string) =>
        policyId === BASELINE_POLICY_ID ? UK_BASELINE_RESULT : UK_REFORM_RESULT
    );
  });

  test("given issue 358's household then it is sent as described, and its result shows", async () => {
    const sent = await calculateUKHousehold("Describe issue 358's household");

    expect(sent).toEqual(ISSUE_358_HOUSEHOLD.toV1CreationPayload());
    expect(sent.data.benunits['your benefit unit'].members).toEqual([
      'you',
      'your first dependent',
    ]);
    expect(sent.data.households['your household']).toMatchObject({
      brma: { [HOUSEHOLD_YEAR]: 'AYLESBURY' },
      region: { [HOUSEHOLD_YEAR]: 'NORTH_EAST' },
      local_authority: { [HOUSEHOLD_YEAR]: 'ABERDEENSHIRE' },
    });
    const result = await screen.findByRole('region', { name: 'Household impact' });
    expect(
      within(result).getByRole('group', { name: 'Change in annual net income' })
    ).toHaveTextContent('+£500');
  });

  test('given a couple and a child then all three share one benefit unit and one household', async () => {
    const sent = await calculateUKHousehold('Describe a couple with a child');

    const everyone = ['you', 'your partner', 'your first dependent'];
    expect(Object.keys(sent.data.people)).toEqual(everyone);
    expect(sent.data.benunits['your benefit unit'].members).toEqual(everyone);
    expect(sent.data.households['your household'].members).toEqual(everyone);
  });

  test('given an input on the benefit unit then it is sent on the benefit unit', async () => {
    const sent = await calculateUKHousehold('Describe a couple with a child');

    expect(sent).toEqual(UK_COUPLE_WITH_BENEFIT_UNIT_INPUT.toV1CreationPayload());
    expect(sent.data.benunits['your benefit unit'].child_benefit_opts_out).toEqual({
      [HOUSEHOLD_YEAR]: true,
    });
    expect(sent.data.households['your household'].child_benefit_opts_out).toBeUndefined();
  });

  test("given a UK household then it runs under the report's two policies, in pounds", async () => {
    await calculateUKHousehold('Describe a couple with a child');

    await waitFor(() =>
      expect(mockFetchHouseholdCalculation.mock.calls).toEqual([
        ['uk', String(CREATED_HOUSEHOLD_ID), BASELINE_POLICY_ID],
        ['uk', String(CREATED_HOUSEHOLD_ID), REFORM_POLICY_ID],
      ])
    );
    const result = await screen.findByRole('region', { name: 'Household impact' });
    expect(within(result).getByRole('table', { name: 'Taxes and benefits' })).toHaveTextContent(
      'Income Tax'
    );
    expect(result).not.toHaveTextContent('$');
  });
});

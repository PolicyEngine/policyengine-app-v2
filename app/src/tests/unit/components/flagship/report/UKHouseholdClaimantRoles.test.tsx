import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent, waitFor } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import HouseholdImpactSection from '@/components/flagship/report/household/HouseholdImpactSection';
import { UK_CLAIMANT_OR_PARTNER_VARIABLE, type Household } from '@/models/Household';
import {
  BASELINE_POLICY_ID,
  calculationResponse,
  CREATED_HOUSEHOLD_ID,
  REFORM_POLICY_ID,
  UK_BASELINE_RESULT,
  UK_REFORM_RESULT,
} from '@/tests/fixtures/libs/flagship/householdRunMocks';
import {
  BUILDER_PEOPLE,
  ROLE_TEST_YEAR,
  singleParentWithAdultDependant,
  UK_METADATA_WITH_CLAIMANT_ROLES,
  UK_METADATA_WITHOUT_CLAIMANT_ROLES,
  ukBuilderMetadata,
} from '@/tests/fixtures/models/builderClaimantRolesMocks';
import type { MetadataState } from '@/types/metadata';

/**
 * UK claimant and partner roles in v3's Household tab: the household is
 * sent with them, as every other place the app saves a household sends it
 * (#1240), so policyengine-uk does not read a lone parent and their adult
 * child as a couple.
 */

let mockMetadata: MetadataState = ukBuilderMetadata(UK_METADATA_WITH_CLAIMANT_ROLES);
vi.mock('react-redux', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-redux')>()),
  useSelector: (selector: (state: any) => unknown) => selector({ metadata: mockMetadata }),
}));

const mockCreateHousehold = vi.fn();
const mockFetchHouseholdCalculation = vi.fn();
vi.mock('@/api/household', () => ({
  createHousehold: (...args: unknown[]) => mockCreateHousehold(...args),
}));
vi.mock('@/api/householdCalculation', () => ({
  fetchHouseholdCalculationWithBundle: async (...args: unknown[]) =>
    calculationResponse(await mockFetchHouseholdCalculation(...args)),
}));

/** The household the builder stand-in hands the section. */
let mockDescribedHousehold: () => Household = singleParentWithAdultDependant;
// The household builder, tested on its own: a stand-in hands the section a
// household the builder makes, as its onChange does.
vi.mock('@/components/household/HouseholdBuilderForm', () => ({
  default: ({ onChange }: { onChange: (household: Household) => void }) => (
    <div aria-label="Household builder">
      <button type="button" onClick={() => onChange(mockDescribedHousehold())}>
        Describe the household
      </button>
    </div>
  ),
}));
// The variation run's keeper, tested on its own: a stand-in shows the
// roles of the household it calculates.
vi.mock('@/components/flagship/report/household/HouseholdBreakdowns', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@/components/flagship/report/household/HouseholdBreakdowns')
  >()),
  HouseholdVariationKeeper: ({ source }: any) => (
    <div aria-label="Variation household">
      {Object.entries(source.household.people as Record<string, Record<string, unknown>>)
        .map(
          ([person, inputs]) =>
            `${person}: ${JSON.stringify(inputs[UK_CLAIMANT_OR_PARTNER_VARIABLE] ?? null)}`
        )
        .join('; ')}
    </div>
  ),
}));
vi.mock('@/utils/HouseholdValidation', () => ({
  HouseholdValidation: { isReadyForSimulation: () => ({ isValid: true, errors: [] }) },
}));

/** Describes the household in a UK report's Household tab, calculates it, and returns what was sent. */
async function calculateUKHousehold() {
  const user = userEvent.setup();
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <HouseholdImpactSection
        countryId="uk"
        year={ROLE_TEST_YEAR}
        baselinePolicyId={BASELINE_POLICY_ID}
        reformPolicyId={REFORM_POLICY_ID}
      />
    </QueryClientProvider>,
    'uk'
  );
  await user.click(screen.getByRole('button', { name: 'Add a household' }));
  await user.click(screen.getByRole('button', { name: 'Describe the household' }));
  await user.click(screen.getByRole('button', { name: 'Calculate' }));
  await waitFor(() => expect(mockCreateHousehold).toHaveBeenCalledTimes(1));
  return mockCreateHousehold.mock.calls[0][0];
}

describe('UK claimant and partner roles in the Household tab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMetadata = ukBuilderMetadata(UK_METADATA_WITH_CLAIMANT_ROLES);
    mockDescribedHousehold = singleParentWithAdultDependant;
    mockCreateHousehold.mockResolvedValue({ result: { household_id: CREATED_HOUSEHOLD_ID } });
    mockFetchHouseholdCalculation.mockImplementation(
      async (_country: string, _household: string, policyId: string) =>
        policyId === BASELINE_POLICY_ID ? UK_BASELINE_RESULT : UK_REFORM_RESULT
    );
  });

  test('given a lone parent and their adult child then they are sent as claimant and dependant, not a couple', async () => {
    const sent = await calculateUKHousehold();

    expect(sent.data.people[BUILDER_PEOPLE.YOU][UK_CLAIMANT_OR_PARTNER_VARIABLE]).toEqual({
      [ROLE_TEST_YEAR]: true,
    });
    expect(
      sent.data.people[BUILDER_PEOPLE.FIRST_DEPENDANT][UK_CLAIMANT_OR_PARTNER_VARIABLE]
    ).toEqual({ [ROLE_TEST_YEAR]: false });
  });

  test('given a household sent with its roles then its result is not marked out of date', async () => {
    await calculateUKHousehold();

    await screen.findByRole('region', { name: 'Household impact' });
    expect(
      screen.queryByText('The inputs changed after this result was calculated.')
    ).not.toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('tab', { name: 'Inputs' }));
    expect(screen.getByText(/These inputs are calculated/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Calculate again' })).toHaveAttribute(
      'aria-disabled',
      'true'
    );
  });

  test('given a household sent with its roles then its variation run calculates it with them', async () => {
    await calculateUKHousehold();

    expect(await screen.findByLabelText('Variation household')).toHaveTextContent(
      `${BUILDER_PEOPLE.YOU}: {"${ROLE_TEST_YEAR}":true}; ${BUILDER_PEOPLE.FIRST_DEPENDANT}: {"${ROLE_TEST_YEAR}":false}`
    );
  });

  test('given a UK model without the roles then a household that carries them is sent without', async () => {
    mockMetadata = ukBuilderMetadata(UK_METADATA_WITHOUT_CLAIMANT_ROLES);
    mockDescribedHousehold = () =>
      singleParentWithAdultDependant().withBuilderClaimantRoles(ROLE_TEST_YEAR);

    const sent = await calculateUKHousehold();

    for (const inputs of Object.values(sent.data.people as Record<string, object>)) {
      expect(inputs).not.toHaveProperty(UK_CLAIMANT_OR_PARTNER_VARIABLE);
    }
  });
});

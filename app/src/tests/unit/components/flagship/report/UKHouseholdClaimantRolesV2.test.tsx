import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent, waitFor } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import HouseholdImpactSection from '@/components/flagship/report/household/HouseholdImpactSection';
import { UK_CLAIMANT_OR_PARTNER_VARIABLE, type Household } from '@/models/Household';
import { V2_REFORM_POLICY_ID } from '@/tests/fixtures/api/v2HouseholdCalculationMocks';
import {
  BUILDER_PEOPLE,
  ROLE_TEST_YEAR,
  ROLE_TEST_YEAR_NUMBER,
  singleParentWithAdultDependant,
  UK_METADATA_WITH_CLAIMANT_ROLES,
  ukBuilderMetadata,
} from '@/tests/fixtures/models/builderClaimantRolesMocks';
import type { MetadataState } from '@/types/metadata';
import type { V2HouseholdCreateBody } from '@/types/v2Households';

/**
 * UK claimant and partner roles in v3's Household tab on the v2 routes:
 * the household is stored with them, as the v1 routes send it, so
 * policyengine-uk does not read a lone parent and their adult child as a
 * couple.
 */

/** v3 after the switch: V3_API_ROUTES is 'v2'. */
vi.mock('@/libs/flagship/v3ApiRoutes', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/libs/flagship/v3ApiRoutes')>()),
  V3_API_ROUTES: 'v2',
}));

const mockMetadata: MetadataState = ukBuilderMetadata(UK_METADATA_WITH_CLAIMANT_ROLES);
vi.mock('react-redux', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-redux')>()),
  useSelector: (selector: (state: unknown) => unknown) => selector({ metadata: mockMetadata }),
}));

const mockStoreHouseholdBody = vi.fn();
vi.mock('@/api/v2Households', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/v2Households')>()),
  storeV2HouseholdBody: (...args: unknown[]) => mockStoreHouseholdBody(...args),
}));
// The calculations are tested on their own: here they never finish, as only
// the household stored is checked.
vi.mock('@/api/v2HouseholdCalculations', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/v2HouseholdCalculations')>()),
  calculateV2Household: () => new Promise(() => {}),
}));
vi.mock('@/hooks/useFlagshipHousehold', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/hooks/useFlagshipHousehold')>()),
  useSaveCalculatedHousehold: () => undefined,
}));
// The household builder, tested on its own: a stand-in hands the section the
// household the builder makes, as its onChange does.
vi.mock('@/components/household/HouseholdBuilderForm', () => ({
  default: ({ onChange }: { onChange: (household: Household) => void }) => (
    <div aria-label="Household builder">
      <button type="button" onClick={() => onChange(singleParentWithAdultDependant())}>
        Describe the household
      </button>
    </div>
  ),
}));
vi.mock('@/utils/HouseholdValidation', () => ({
  HouseholdValidation: { isReadyForSimulation: () => ({ isValid: true, errors: [] }) },
}));

/** Describes the household in a UK report's Household tab, calculates it, and returns what was stored. */
async function storeUKHousehold(): Promise<V2HouseholdCreateBody> {
  const user = userEvent.setup();
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <HouseholdImpactSection
        countryId="uk"
        year={ROLE_TEST_YEAR}
        baselinePolicyId={String(mockMetadata.currentLawId)}
        reformPolicyId={V2_REFORM_POLICY_ID}
      />
    </QueryClientProvider>,
    'uk'
  );
  await user.click(screen.getByRole('button', { name: 'Add a household' }));
  await user.click(screen.getByRole('button', { name: 'Describe the household' }));
  await user.click(screen.getByRole('button', { name: 'Calculate' }));
  await waitFor(() => expect(mockStoreHouseholdBody).toHaveBeenCalledTimes(1));
  return mockStoreHouseholdBody.mock.calls[0][0] as V2HouseholdCreateBody;
}

/** A stored person's claimant-or-partner input, by their v1 name. */
function claimantRoleOf(stored: V2HouseholdCreateBody, personName: string) {
  const person = stored.household_data.people.find(
    (candidate) => candidate.source_name === personName
  );
  return person?.values[UK_CLAIMANT_OR_PARTNER_VARIABLE];
}

describe('UK claimant and partner roles in the Household tab on the v2 routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStoreHouseholdBody.mockReturnValue(new Promise(() => {}));
  });

  test('given a lone parent and their adult child then they are stored as claimant and dependant, not a couple', async () => {
    // When
    const stored = await storeUKHousehold();

    // Then
    expect(stored.country_id).toBe('uk');
    expect(stored.default_year).toBe(ROLE_TEST_YEAR_NUMBER);
    expect(claimantRoleOf(stored, BUILDER_PEOPLE.YOU)).toEqual({ [ROLE_TEST_YEAR]: true });
    expect(claimantRoleOf(stored, BUILDER_PEOPLE.FIRST_DEPENDANT)).toEqual({
      [ROLE_TEST_YEAR]: false,
    });
  });
});

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, userEvent, waitFor } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { V2HouseholdCalculationRequest } from '@/api/v2HouseholdCalculations';
import HouseholdImpactSection from '@/components/flagship/report/household/HouseholdImpactSection';
import { store } from '@/store';
import {
  calculationItem,
  calculationOutput,
  V2_CALCULATION_IDS,
  V2_REFORM_POLICY_ID,
} from '@/tests/fixtures/api/v2HouseholdCalculationMocks';
import { HOUSEHOLD_YEAR } from '@/tests/fixtures/libs/flagship/householdRunMocks';
import {
  STORED_V2_HOUSEHOLD_ID,
  storedV2Household,
} from '@/tests/fixtures/models/household/v2DocumentCodecMocks';
import type {
  V2HouseholdCreateBody,
  V2HouseholdDocument,
  V2HouseholdEntityRecord,
} from '@/types/v2Households';

/** v3 after the switch: V3_API_ROUTES is 'v2'. */
vi.mock('@/libs/flagship/v3ApiRoutes', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/libs/flagship/v3ApiRoutes')>()),
  V3_API_ROUTES: 'v2',
}));

const mockStoreHousehold = vi.fn();
const mockCalculate = vi.fn();
vi.mock('@/api/v2Households', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/v2Households')>()),
  storeV2HouseholdBody: (...args: unknown[]) => mockStoreHousehold(...args),
}));
vi.mock('@/api/v2HouseholdCalculations', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/v2HouseholdCalculations')>()),
  calculateV2Household: (...args: unknown[]) => mockCalculate(...args),
}));

// Saving a calculated household to the user is tested on its own: here only
// what the section passes to it is checked.
const mockSaveCalculatedHousehold = vi.fn();
vi.mock('@/hooks/useFlagshipHousehold', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/hooks/useFlagshipHousehold')>()),
  useSaveCalculatedHousehold: (household: unknown) => mockSaveCalculatedHousehold(household),
}));

// The household builder is tested on its own.
vi.mock('@/components/household/HouseholdBuilderForm', () => ({
  default: () => <div aria-label="Household builder" />,
}));
vi.mock('@/utils/HouseholdValidation', () => ({
  HouseholdValidation: { isReadyForSimulation: () => ({ isValid: true, errors: [] }) },
}));

/** Each US collection of a stored household, beside the name the calculation gives it. */
const US_COLLECTIONS = [
  ['household', 'households'],
  ['family', 'families'],
  ['tax_unit', 'tax_units'],
  ['spm_unit', 'spm_units'],
  ['marital_unit', 'marital_units'],
] as const;

/**
 * A stored household as the simulation service calculates it: people and
 * groups keyed by their record IDs, each group with its members and the
 * household with its net income for the year.
 */
function calculatedSituation(document: V2HouseholdDocument, netIncome: number) {
  const groupsOf = document as unknown as Record<string, V2HouseholdEntityRecord[] | undefined>;
  const situation: Record<string, unknown> = {
    people: Object.fromEntries(document.people.map((person) => [person.id, person.values])),
  };
  for (const [collection, calculatedName] of US_COLLECTIONS) {
    situation[calculatedName] = Object.fromEntries(
      (groupsOf[collection] ?? []).map((group) => [
        group.id,
        {
          ...group.values,
          members: document.people
            .filter((person) => person.memberships[collection] === group.id)
            .map((person) => person.id),
          ...(collection === 'household'
            ? { household_net_income: { [HOUSEHOLD_YEAR]: netIncome } }
            : {}),
        },
      ])
    );
  }
  return situation;
}

/** The household the section stored, as `POST /v2/households` answers with it. */
let storedDocument: V2HouseholdDocument;

function renderSection() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <HouseholdImpactSection
        countryId="us"
        year={HOUSEHOLD_YEAR}
        baselinePolicyId={String(store.getState().metadata.currentLawId)}
        reformPolicyId={V2_REFORM_POLICY_ID}
      />
    </QueryClientProvider>
  );
  act(() => screen.getByRole('button', { name: 'Add a household' }).click());
}

describe('HouseholdImpactSection with v3 on the v2 routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStoreHousehold.mockImplementation(async (body: V2HouseholdCreateBody) => {
      storedDocument = body.household_data;
      return storedV2Household('us', storedDocument);
    });
    mockCalculate.mockImplementation(async (request: V2HouseholdCalculationRequest) => {
      const reform = request.policyId === V2_REFORM_POLICY_ID;
      return calculationItem({
        calculation_id: reform ? V2_CALCULATION_IDS.REFORM : V2_CALCULATION_IDS.BASELINE,
        policy_id: request.policyId,
        result: calculationOutput({
          household: calculatedSituation(storedDocument, reform ? 13_000 : 12_000),
        }),
      });
    });
    // Radix Select scrolls its options and captures the pointer, which jsdom lacks.
    Element.prototype.scrollIntoView ??= vi.fn();
    Element.prototype.hasPointerCapture ??= vi.fn(() => false);
  });

  test('given Calculate then the household is stored once and calculated under each policy, and its variation across earnings starts', async () => {
    // Given
    const user = userEvent.setup();
    renderSection();

    // When
    await user.click(screen.getByRole('button', { name: 'Calculate' }));

    // Then
    expect(await screen.findByRole('region', { name: 'Household impact' })).toBeInTheDocument();
    expect(mockStoreHousehold).toHaveBeenCalledOnce();
    await waitFor(() => expect(mockCalculate).toHaveBeenCalledTimes(4));
    const requests = mockCalculate.mock.calls.map(
      ([request]) => request as V2HouseholdCalculationRequest
    );
    const describeRequest = (request: V2HouseholdCalculationRequest) =>
      `${request.policyId ?? 'current law'}${request.axes ? ', across earnings' : ''}`;
    expect(requests.map(describeRequest).sort()).toEqual(
      [
        'current law',
        'current law, across earnings',
        V2_REFORM_POLICY_ID,
        `${V2_REFORM_POLICY_ID}, across earnings`,
      ].sort()
    );
    expect(requests.every((request) => request.householdId === STORED_V2_HOUSEHOLD_ID)).toBe(true);
  });

  test('given a calculated household then it is saved to the user by its v2 ID', async () => {
    // Given
    const user = userEvent.setup();
    renderSection();

    // When
    await user.click(screen.getByRole('button', { name: 'Calculate' }));

    // Then
    await screen.findByRole('region', { name: 'Household impact' });
    expect(mockSaveCalculatedHousehold).toHaveBeenLastCalledWith({
      countryId: 'us',
      household: { id: STORED_V2_HOUSEHOLD_ID, name: expect.any(String) },
    });
  });
});

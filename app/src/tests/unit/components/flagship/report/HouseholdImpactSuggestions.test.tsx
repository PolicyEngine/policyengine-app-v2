import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent, waitFor } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import HouseholdImpactSection from '@/components/flagship/report/household/HouseholdImpactSection';
import {
  UK_CHILD_ELEMENT_PATH,
  UK_INPUT_VARIABLES,
  UK_MICRODATA_ONLY_INPUT,
} from '@/tests/fixtures/components/flagship/report/householdSuggestionMocks';
import {
  BASELINE_POLICY_ID,
  HOUSEHOLD_YEAR,
  REFORM_POLICY_ID,
} from '@/tests/fixtures/libs/flagship/householdRunMocks';

// The model's inputs, as its metadata lists them.
vi.mock('@/utils/VariableResolver', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/utils/VariableResolver')>()),
  getInputVariables: () => UK_INPUT_VARIABLES,
}));
// The household builder, tested on its own: a stand-in shows the inputs it is asked to lead with.
vi.mock('@/components/household/HouseholdBuilderForm', () => ({
  default: ({ suggestedVariables }: { suggestedVariables?: string[] }) => (
    <div aria-label="Household builder" data-suggested={(suggestedVariables ?? []).join(' ')} />
  ),
}));
vi.mock('@/utils/HouseholdValidation', () => ({
  HouseholdValidation: { isReadyForSimulation: () => ({ isValid: true, errors: [] }) },
}));

function renderSection(countryId: string, reformPaths: string[]) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <HouseholdImpactSection
        countryId={countryId}
        year={HOUSEHOLD_YEAR}
        baselinePolicyId={BASELINE_POLICY_ID}
        reformPolicyId={REFORM_POLICY_ID}
        reformPaths={reformPaths}
      />
    </QueryClientProvider>,
    countryId
  );
}

const suggestedInputs = () =>
  (screen.getByRole('generic', { name: 'Household builder' }).getAttribute('data-suggested') ?? '')
    .split(' ')
    .filter(Boolean);

describe('HouseholdImpactSection suggestions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("given a UK reform to Universal Credit's child element then the inputs it reads are suggested", async () => {
    const user = userEvent.setup();
    renderSection('uk', [UK_CHILD_ELEMENT_PATH]);

    await user.click(screen.getByRole('button', { name: 'Add a household' }));

    await waitFor(() => expect(suggestedInputs()).toContain('childcare_expenses'));
    expect(suggestedInputs()).toContain('age');
  });

  test('given a UK reform then an input only the microdata sets is never suggested', async () => {
    const user = userEvent.setup();
    renderSection('uk', [UK_CHILD_ELEMENT_PATH]);

    await user.click(screen.getByRole('button', { name: 'Add a household' }));

    await waitFor(() => expect(suggestedInputs()).toContain('age'));
    expect(suggestedInputs()).not.toContain(UK_MICRODATA_ONLY_INPUT);
  });
});

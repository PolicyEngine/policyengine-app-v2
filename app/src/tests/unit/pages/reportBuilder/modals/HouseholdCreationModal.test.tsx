import { fireEvent, render, screen, userEvent, waitFor } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { Household } from '@/models/Household';
import { HouseholdCreationModal } from '@/pages/reportBuilder/modals/HouseholdCreationModal';
import type { PopulationStateProps } from '@/types/pathwayState';

const mockCreateHouseholdWithLabel = vi.hoisted(() => vi.fn());

const mockReduxState = {
  metadata: {
    basicInputs: [],
    variables: {},
    entities: {},
  },
};

vi.mock('react-redux', async () => {
  const actual = await vi.importActual<typeof import('react-redux')>('react-redux');
  return {
    ...actual,
    useSelector: (selector: (state: typeof mockReduxState) => unknown) => selector(mockReduxState),
  };
});

vi.mock('@/hooks/useCurrentCountry', () => ({
  useCurrentCountry: () => 'us',
}));

vi.mock('@/hooks/useCreateHousehold', () => ({
  useCreateHousehold: () => ({
    createHouseholdWithLabel: mockCreateHouseholdWithLabel,
    isPending: false,
  }),
}));

vi.mock('@/hooks/useUserHousehold', () => ({
  useUpdateHouseholdAssociation: () => ({
    mutateAsync: vi.fn(),
  }),
}));

vi.mock('@/utils/HouseholdValidation', () => ({
  HouseholdValidation: {
    isReadyForSimulation: vi.fn(() => ({ isValid: true, errors: [] })),
  },
}));

vi.mock('@/pages/reportBuilder/modals/population', () => ({
  HouseholdCreationContent: ({ householdDraft, onChange }: any) => (
    <button type="button" onClick={() => onChange(householdDraft.withLabel('Changed household'))}>
      Make household change
    </button>
  ),
}));

const initialHousehold = Household.starter('us', '2024')
  .withId('hh-123')
  .withLabel('Test household');
const initialPopulation: PopulationStateProps = {
  type: 'household',
  household: initialHousehold,
  geography: null,
  label: 'Test household',
};

describe('HouseholdCreationModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateHouseholdWithLabel.mockResolvedValue({ result: { household_id: 'hh-new' } });
  });

  test('given save as new household then asks for a new name before creating', async () => {
    const user = userEvent.setup();
    const onHouseholdSaved = vi.fn();

    render(
      <HouseholdCreationModal
        isOpen
        onClose={vi.fn()}
        onHouseholdSaved={onHouseholdSaved}
        reportYear="2024"
        initialPopulation={initialPopulation}
        initialAssociation={{
          id: 'uhh-123',
          type: 'household',
          userId: 'user-1',
          householdId: 'hh-123',
          countryId: 'us',
          label: 'Test household',
        }}
        initialEditorMode="edit"
      />
    );

    await user.click(screen.getByRole('button', { name: /make household change/i }));

    const saveAsNewButton = screen.getByRole('button', { name: /save as new household/i });
    await waitFor(() => expect(saveAsNewButton).not.toBeDisabled());
    await user.click(saveAsNewButton);

    expect(screen.getByRole('heading', { name: /save as new household/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /keep same name/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();

    const nameInput = screen.getByRole('textbox', { name: /new household name/i });
    fireEvent.change(nameInput, { target: { value: 'Renamed household' } });
    await user.click(screen.getByRole('button', { name: /save with new name/i }));

    await waitFor(() => {
      expect(mockCreateHouseholdWithLabel).toHaveBeenCalledWith(
        expect.any(Object),
        'Renamed household'
      );
    });
    expect(onHouseholdSaved).toHaveBeenCalledWith(
      expect.objectContaining({
        label: 'Renamed household',
        type: 'household',
      })
    );
  });

  test('given keep same name from save as new household then creates with current name', async () => {
    const user = userEvent.setup();

    render(
      <HouseholdCreationModal
        isOpen
        onClose={vi.fn()}
        onHouseholdSaved={vi.fn()}
        reportYear="2024"
        initialPopulation={initialPopulation}
        initialAssociation={{
          id: 'uhh-123',
          type: 'household',
          userId: 'user-1',
          householdId: 'hh-123',
          countryId: 'us',
          label: 'Test household',
        }}
        initialEditorMode="edit"
      />
    );

    await user.click(screen.getByRole('button', { name: /make household change/i }));

    const saveAsNewButton = screen.getByRole('button', { name: /save as new household/i });
    await waitFor(() => expect(saveAsNewButton).not.toBeDisabled());
    await user.click(saveAsNewButton);
    await user.click(screen.getByRole('button', { name: /keep same name/i }));

    await waitFor(() => {
      expect(mockCreateHouseholdWithLabel).toHaveBeenCalledWith(
        expect.any(Object),
        'Changed household'
      );
    });
  });
});

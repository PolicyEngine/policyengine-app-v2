import { fireEvent, render, screen, waitFor } from '@test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { Household, UK_CLAIMANT_OR_PARTNER_VARIABLE } from '@/models/Household';
import { HouseholdCreationModal } from '@/pages/reportBuilder/modals/HouseholdCreationModal';
import {
  BUILDER_PEOPLE,
  ROLE_TEST_YEAR,
  singleParentWithAdultDependant,
  UK_METADATA_WITH_CLAIMANT_ROLES,
} from '@/tests/fixtures/models/builderClaimantRolesMocks';
import type { PopulationStateProps } from '@/types/pathwayState';

const mockCreateHouseholdWithLabel = vi.hoisted(() => vi.fn());
const mockUpdateHouseholdAssociation = vi.hoisted(() => vi.fn());
const mockHouseholdAssociationRefetch = vi.hoisted(() => vi.fn());
const MODAL_TEST_TIMEOUT_MS = 20_000;

const US_MODAL_METADATA = {
  currentCountry: 'us',
  loading: false,
  error: null,
  version: 'test-model',
  basicInputs: [],
  variables: {} as Record<string, unknown>,
  entities: {},
};

const mockReduxState = {
  metadata: US_MODAL_METADATA,
};

vi.mock('react-redux', async () => {
  const actual = await vi.importActual<typeof import('react-redux')>('react-redux');
  return {
    ...actual,
    useSelector: (selector: (state: typeof mockReduxState) => unknown) => selector(mockReduxState),
  };
});

vi.mock('@/hooks/useCurrentCountry', () => ({
  useCurrentCountry: () => mockReduxState.metadata.currentCountry,
}));

vi.mock('@/hooks/useCreateHousehold', () => ({
  useCreateHousehold: () => ({
    createHouseholdWithLabel: mockCreateHouseholdWithLabel,
    isPending: false,
  }),
}));

vi.mock('@/hooks/useUserHousehold', () => ({
  useHouseholdAssociation: () => ({
    data: null,
    refetch: mockHouseholdAssociationRefetch,
  }),
  useUpdateHouseholdAssociation: () => ({
    mutateAsync: mockUpdateHouseholdAssociation,
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
    mockUpdateHouseholdAssociation.mockResolvedValue({
      id: 'uhh-123',
      type: 'household',
      userId: 'user-1',
      householdId: 'hh-replacement',
      countryId: 'us',
      label: 'Changed household',
    });
    mockHouseholdAssociationRefetch.mockResolvedValue({
      data: {
        id: 'uhh-123',
        type: 'household',
        userId: 'user-1',
        householdId: 'hh-123',
        countryId: 'us',
        label: 'Test household',
      },
    });
  });

  test(
    'given save as new household then asks for a new name before creating',
    async () => {
      const onHouseholdSaved = vi.fn();

      render(
        <HouseholdCreationModal
          isOpen
          onClose={vi.fn()}
          onHouseholdSaved={onHouseholdSaved}
          reportYear="2024"
          initialPopulation={initialPopulation}
          initialEditorMode="edit"
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /make household change/i }));

      const saveAsNewButton = screen.getByRole('button', { name: /save as new household/i });
      await waitFor(() => expect(saveAsNewButton).not.toBeDisabled());
      fireEvent.click(saveAsNewButton);

      expect(screen.getByRole('heading', { name: /save as new household/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /keep same name/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();

      const nameInput = screen.getByRole('textbox', { name: /new household name/i });
      fireEvent.change(nameInput, { target: { value: 'Renamed household' } });
      fireEvent.click(screen.getByRole('button', { name: /save with new name/i }));

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
    },
    MODAL_TEST_TIMEOUT_MS
  );

  test(
    'given keep same name from save as new household then creates with current name',
    async () => {
      render(
        <HouseholdCreationModal
          isOpen
          onClose={vi.fn()}
          onHouseholdSaved={vi.fn()}
          reportYear="2024"
          initialPopulation={initialPopulation}
          initialEditorMode="edit"
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /make household change/i }));

      const saveAsNewButton = screen.getByRole('button', { name: /save as new household/i });
      await waitFor(() => expect(saveAsNewButton).not.toBeDisabled());
      fireEvent.click(saveAsNewButton);
      fireEvent.click(screen.getByRole('button', { name: /keep same name/i }));

      await waitFor(() => {
        expect(mockCreateHouseholdWithLabel).toHaveBeenCalledWith(
          expect.any(Object),
          'Changed household'
        );
      });
    },
    MODAL_TEST_TIMEOUT_MS
  );

  test(
    'given update existing household then resolves saved association by household id',
    async () => {
      const onHouseholdSaved = vi.fn();

      render(
        <HouseholdCreationModal
          isOpen
          onClose={vi.fn()}
          onHouseholdSaved={onHouseholdSaved}
          reportYear="2024"
          initialPopulation={initialPopulation}
          initialEditorMode="edit"
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /make household change/i }));

      const updateButton = screen.getByRole('button', { name: /update existing household/i });
      await waitFor(() => expect(updateButton).not.toBeDisabled());
      fireEvent.click(updateButton);

      await waitFor(() => {
        expect(mockHouseholdAssociationRefetch).toHaveBeenCalled();
      });
      await waitFor(() => {
        expect(mockUpdateHouseholdAssociation).toHaveBeenCalledWith({
          userHouseholdId: 'uhh-123',
          updates: {},
          association: expect.objectContaining({
            id: 'uhh-123',
            householdId: 'hh-123',
          }),
          nextHousehold: expect.any(Household),
        });
      });
      expect(onHouseholdSaved).toHaveBeenCalledWith(
        expect.objectContaining({
          label: 'Changed household',
          type: 'household',
        })
      );
    },
    MODAL_TEST_TIMEOUT_MS
  );

  describe('given a UK lone parent with a dependant aged 25', () => {
    const ukPopulation: PopulationStateProps = {
      type: 'household',
      household: singleParentWithAdultDependant().withId('hh-uk').withLabel('Lone parent'),
      geography: null,
      label: 'Lone parent',
    };
    const roleOf = (household: Household, personName: string) =>
      household.getPersonVariableAtYear(
        personName,
        UK_CLAIMANT_OR_PARTNER_VARIABLE,
        ROLE_TEST_YEAR
      );

    beforeEach(() => {
      mockReduxState.metadata = {
        ...US_MODAL_METADATA,
        currentCountry: 'uk',
        variables: UK_METADATA_WITH_CLAIMANT_ROLES.variables,
      };
    });

    afterEach(() => {
      mockReduxState.metadata = US_MODAL_METADATA;
    });

    const renderUKModal = (onHouseholdSaved = vi.fn()) =>
      render(
        <HouseholdCreationModal
          isOpen
          onClose={vi.fn()}
          onHouseholdSaved={onHouseholdSaved}
          reportYear={ROLE_TEST_YEAR}
          initialPopulation={ukPopulation}
          initialEditorMode="edit"
        />
      );

    test(
      'given save as new household then saves one claimant and a dependant who is not a partner',
      async () => {
        const onHouseholdSaved = vi.fn();
        renderUKModal(onHouseholdSaved);

        fireEvent.click(screen.getByRole('button', { name: /make household change/i }));
        const saveAsNewButton = screen.getByRole('button', { name: /save as new household/i });
        await waitFor(() => expect(saveAsNewButton).not.toBeDisabled());
        fireEvent.click(saveAsNewButton);
        fireEvent.click(screen.getByRole('button', { name: /keep same name/i }));

        await waitFor(() => expect(mockCreateHouseholdWithLabel).toHaveBeenCalled());
        const [payload] = mockCreateHouseholdWithLabel.mock.calls[0];
        expect(payload.data.people[BUILDER_PEOPLE.YOU][UK_CLAIMANT_OR_PARTNER_VARIABLE]).toEqual({
          [ROLE_TEST_YEAR]: true,
        });
        expect(
          payload.data.people[BUILDER_PEOPLE.FIRST_DEPENDANT][UK_CLAIMANT_OR_PARTNER_VARIABLE]
        ).toEqual({ [ROLE_TEST_YEAR]: false });
        const savedHousehold: Household = onHouseholdSaved.mock.calls[0][0].household;
        expect(roleOf(savedHousehold, BUILDER_PEOPLE.YOU)).toBe(true);
        expect(roleOf(savedHousehold, BUILDER_PEOPLE.FIRST_DEPENDANT)).toBe(false);
      },
      MODAL_TEST_TIMEOUT_MS
    );

    test(
      'given update existing household then replaces it with the roles recorded',
      async () => {
        mockUpdateHouseholdAssociation.mockResolvedValue({
          id: 'uhh-uk',
          type: 'household',
          userId: 'user-1',
          householdId: 'hh-uk-replacement',
          countryId: 'uk',
          label: 'Changed household',
        });
        mockHouseholdAssociationRefetch.mockResolvedValue({
          data: {
            id: 'uhh-uk',
            type: 'household',
            userId: 'user-1',
            householdId: 'hh-uk',
            countryId: 'uk',
            label: 'Lone parent',
          },
        });
        renderUKModal();

        fireEvent.click(screen.getByRole('button', { name: /make household change/i }));
        const updateButton = screen.getByRole('button', { name: /update existing household/i });
        await waitFor(() => expect(updateButton).not.toBeDisabled());
        fireEvent.click(updateButton);

        await waitFor(() => expect(mockUpdateHouseholdAssociation).toHaveBeenCalled());
        const { nextHousehold } = mockUpdateHouseholdAssociation.mock.calls[0][0];
        expect(roleOf(nextHousehold, BUILDER_PEOPLE.YOU)).toBe(true);
        expect(roleOf(nextHousehold, BUILDER_PEOPLE.FIRST_DEPENDANT)).toBe(false);
      },
      MODAL_TEST_TIMEOUT_MS
    );
  });
});

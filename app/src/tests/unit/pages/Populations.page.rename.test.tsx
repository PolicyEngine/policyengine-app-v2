import { render, screen, userEvent, waitFor } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import PopulationsPage from '@/pages/Populations.page';
import {
  createMockGeographicAssociationsData,
  createMockUserHouseholdsData,
} from '@/tests/fixtures/pages/populationsMocks';

const {
  mockUpdateHouseholdAssociation,
  mockUpdateGeographicAssociation,
  mockUseUserHouseholds,
  mockUseUserGeographics,
} = vi.hoisted(() => ({
  mockUpdateHouseholdAssociation: {
    mutateAsync: vi.fn(),
    isPending: false,
  },
  mockUpdateGeographicAssociation: {
    mutateAsync: vi.fn(),
    isPending: false,
  },
  mockUseUserHouseholds: vi.fn(),
  mockUseUserGeographics: vi.fn(),
}));

vi.mock('@/hooks/useUserHousehold', () => ({
  useUserHouseholds: mockUseUserHouseholds,
  useUpdateHouseholdAssociation: () => mockUpdateHouseholdAssociation,
}));

vi.mock('@/hooks/useUserGeographic', () => ({
  useUserGeographics: mockUseUserGeographics,
  useUpdateGeographicAssociation: () => mockUpdateGeographicAssociation,
}));

vi.mock('@/hooks/useCurrentCountry', () => ({
  useCurrentCountry: () => 'us',
}));

vi.mock('@/components/IngredientReadView', () => ({
  default: ({ data, columns }: any) => {
    const actionsColumn = columns.find((column: any) => column.type === 'menu');

    return (
      <div>
        {data.map((record: any) => (
          <button
            key={record.id}
            type="button"
            onClick={() => actionsColumn.onAction('rename', record.id)}
          >
            Rename {record.id}
          </button>
        ))}
      </div>
    );
  },
}));

vi.mock('@/components/common/RenameIngredientModal', () => ({
  RenameIngredientModal: ({ opened, onRename, currentLabel }: any) =>
    opened ? (
      <button type="button" onClick={() => onRename(`Renamed ${currentLabel}`)}>
        Confirm rename
      </button>
    ) : null,
}));

describe('PopulationsPage rename flows', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseUserHouseholds.mockReturnValue({
      data: createMockUserHouseholdsData(),
      isLoading: false,
      isError: false,
      error: null,
    });

    mockUseUserGeographics.mockReturnValue({
      data: createMockGeographicAssociationsData(),
      isLoading: false,
      isError: false,
      error: null,
    });
  });

  test('given household rename action then routes through update household association hook', async () => {
    const user = userEvent.setup();
    render(<PopulationsPage />);

    await user.click(screen.getByRole('button', { name: 'Rename 1' }));
    await user.click(screen.getByRole('button', { name: 'Confirm rename' }));

    await waitFor(() => {
      expect(mockUpdateHouseholdAssociation.mutateAsync).toHaveBeenCalledWith({
        userHouseholdId: '1',
        updates: { label: 'Renamed My Test Household' },
      });
    });
    expect(mockUpdateGeographicAssociation.mutateAsync).not.toHaveBeenCalled();
  });

  test('given geography rename action then routes through update geographic association hook', async () => {
    const user = userEvent.setup();
    render(<PopulationsPage />);

    await user.click(screen.getByRole('button', { name: 'Rename ca' }));
    await user.click(screen.getByRole('button', { name: 'Confirm rename' }));

    await waitFor(() => {
      expect(mockUpdateGeographicAssociation.mutateAsync).toHaveBeenCalledWith({
        userId: 'test-user-123',
        geographyId: 'ca',
        updates: { label: 'Renamed California Population' },
      });
    });
    expect(mockUpdateHouseholdAssociation.mutateAsync).not.toHaveBeenCalled();
  });
});

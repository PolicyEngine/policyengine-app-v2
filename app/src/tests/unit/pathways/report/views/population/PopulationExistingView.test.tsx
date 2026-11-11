import React from 'react';
import { render, screen, userEvent } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { UserHouseholdMetadataWithAssociation } from '@/hooks/useUserHousehold';
import { Household as HouseholdModel } from '@/models/Household';
import PopulationExistingView from '@/pathways/report/views/population/PopulationExistingView';

const mockUseUserHouseholds = vi.fn();
const mockUseUserGeographics = vi.fn();

vi.mock('@/constants', () => ({
  MOCK_USER_ID: 'test-user-123',
}));

vi.mock('@/hooks/useUserHousehold', () => ({
  useUserHouseholds: () => mockUseUserHouseholds(),
  isHouseholdMetadataWithAssociation: (value: unknown) =>
    !!value &&
    typeof value === 'object' &&
    value !== null &&
    'association' in value &&
    'household' in value,
}));

vi.mock('@/hooks/useUserGeographic', () => ({
  useUserGeographics: () => mockUseUserGeographics(),
  isGeographicMetadataWithAssociation: () => false,
}));

vi.mock('@/utils/validation/ingredientValidation', () => ({
  isHouseholdAssociationReady: () => true,
  isGeographicAssociationReady: () => false,
}));

const selectedHousehold = HouseholdModel.fromDraft({
  id: 'household-123',
  countryId: 'us',
  householdData: {
    people: {
      you: {
        age: { 2026: 40 },
      },
    },
    households: {
      household1: {
        members: ['you'],
      },
    },
  },
  label: 'Selected household',
});

const mockHouseholdAssociation: UserHouseholdMetadataWithAssociation = {
  association: {
    id: 'user-household-123',
    type: 'household',
    userId: 'test-user-123',
    householdId: 'household-123',
    countryId: 'us',
    label: 'Selected household',
    createdAt: '2026-04-10T12:00:00Z',
  },
  household: selectedHousehold,
  isLoading: false,
  error: null,
  isError: false,
};

function renderView(props?: Partial<React.ComponentProps<typeof PopulationExistingView>>) {
  return render(
    <PopulationExistingView onSelectHousehold={vi.fn()} onSelectGeography={vi.fn()} {...props} />
  );
}

describe('PopulationExistingView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseUserHouseholds.mockReturnValue({
      data: [mockHouseholdAssociation],
      isLoading: false,
      isError: false,
      error: null,
    });
    mockUseUserGeographics.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
    });
  });

  test('given a saved household selection then it passes the canonical household model to onSelectHousehold', async () => {
    const user = userEvent.setup();
    const onSelectHousehold = vi.fn();

    renderView({ onSelectHousehold });

    await user.click(
      screen.getByRole('button', {
        name: 'Selected household Household #household-123',
      })
    );
    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(onSelectHousehold).toHaveBeenCalledWith(
      'household-123',
      selectedHousehold,
      'Selected household'
    );
  });

  test('given a household detail error then displays an unselectable card with a warning icon', async () => {
    const user = userEvent.setup();
    const onSelectHousehold = vi.fn();
    mockUseUserHouseholds.mockReturnValue({
      data: [
        {
          ...mockHouseholdAssociation,
          association: {
            ...mockHouseholdAssociation.association,
            id: 'broken-association',
            householdId: 'broken-household',
            label: 'Broken household',
          },
          household: undefined,
          isError: true,
          error: new Error('Household request failed'),
        },
      ],
      isLoading: false,
      isError: false,
      error: null,
    });

    renderView({ onSelectHousehold });
    const householdCard = screen.getByText('Broken household').closest('button');

    expect(householdCard).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByText('Failed to load')).toBeInTheDocument();
    expect(screen.getByLabelText('Error loading this population')).toBeInTheDocument();

    await user.click(householdCard!);
    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();
    expect(onSelectHousehold).not.toHaveBeenCalled();
  });

  test('given a selected household later errors then disables submission', async () => {
    const user = userEvent.setup();
    const onSelectHousehold = vi.fn();
    let queryResult = {
      data: [mockHouseholdAssociation],
      isLoading: false,
      isError: false,
      error: null,
    };
    mockUseUserHouseholds.mockImplementation(() => queryResult);
    const { rerender } = renderView({ onSelectHousehold });

    await user.click(
      screen.getByRole('button', {
        name: 'Selected household Household #household-123',
      })
    );
    expect(screen.getByRole('button', { name: /next/i })).toBeEnabled();

    queryResult = {
      ...queryResult,
      data: [
        {
          ...mockHouseholdAssociation,
          household: undefined,
          isError: true,
          error: new Error('Household request failed'),
        },
      ],
    } as any;
    rerender(
      <PopulationExistingView onSelectHousehold={onSelectHousehold} onSelectGeography={vi.fn()} />
    );

    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: /next/i }));
    expect(onSelectHousehold).not.toHaveBeenCalled();
  });
});

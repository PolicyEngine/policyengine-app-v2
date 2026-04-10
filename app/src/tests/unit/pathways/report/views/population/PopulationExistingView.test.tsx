import React from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
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

vi.mock('@/components/common/PathwayView', () => ({
  default: ({
    title,
    cardListItems = [],
    primaryAction,
  }: {
    title: string;
    cardListItems?: Array<{
      id: string;
      title: string;
      subtitle?: string;
      onClick: () => void;
    }>;
    primaryAction?: {
      label: string;
      onClick: () => void;
      isDisabled?: boolean;
    };
  }) => (
    <div>
      <h1>{title}</h1>
      {cardListItems.map((item) => (
        <button key={item.id} type="button" onClick={item.onClick}>
          {item.title}
        </button>
      ))}
      {primaryAction ? (
        <button type="button" onClick={primaryAction.onClick} disabled={primaryAction.isDisabled}>
          {primaryAction.label}
        </button>
      ) : null}
    </div>
  ),
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

function createStore() {
  return configureStore({
    reducer: {
      metadata: () => ({
        currentCountry: 'us',
        economyOptions: { region: [] },
      }),
    },
  });
}

function renderView(props?: Partial<React.ComponentProps<typeof PopulationExistingView>>) {
  return render(
    <Provider store={createStore()}>
      <PopulationExistingView onSelectHousehold={vi.fn()} onSelectGeography={vi.fn()} {...props} />
    </Provider>
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

    await user.click(screen.getByRole('button', { name: 'Selected household' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(onSelectHousehold).toHaveBeenCalledWith(
      'household-123',
      selectedHousehold,
      'Selected household'
    );
  });
});

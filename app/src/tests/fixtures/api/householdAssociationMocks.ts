import { UserHouseholdPopulation } from '@/types/ingredients/UserPopulation';

export const mockUserHouseholdPopulation: UserHouseholdPopulation = {
  type: 'household',
  id: 'household-123',
  householdId: 'household-123',
  userId: 'user-456',
  userLabel: 'My Test Household',
  countryId: 'us',
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z',
  isDefault: false,
  isCreated: true,
};

export const mockUserHouseholdPopulationList: UserHouseholdPopulation[] = [
  {
    type: 'household',
    id: 'household-1',
    householdId: 'household-1',
    userId: 'user-456',
    userLabel: 'First Household',
    countryId: 'us',
    createdAt: '2024-01-10T10:00:00Z',
    updatedAt: '2024-01-10T10:00:00Z',
    isDefault: true,
    isCreated: true,
  },
  {
    type: 'household',
    id: 'household-2',
    householdId: 'household-2',
    userId: 'user-456',
    userLabel: 'Second Household',
    countryId: 'uk',
    createdAt: '2024-01-12T10:00:00Z',
    updatedAt: '2024-01-12T10:00:00Z',
    isDefault: false,
    isCreated: true,
  },
];

export const mockApiResponse = {
  id: 'household-123',
  household_id: 'household-123',
  user_id: 'user-456',
  user_label: 'My Test Household',
  country_id: 'us',
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z',
  is_default: false,
};

export const mockApiResponseList = [
  {
    id: 'household-1',
    household_id: 'household-1',
    user_id: 'user-456',
    user_label: 'First Household',
    country_id: 'us',
    created_at: '2024-01-10T10:00:00Z',
    updated_at: '2024-01-10T10:00:00Z',
    is_default: true,
  },
  {
    id: 'household-2',
    household_id: 'household-2',
    user_id: 'user-456',
    user_label: 'Second Household',
    country_id: 'uk',
    created_at: '2024-01-12T10:00:00Z',
    updated_at: '2024-01-12T10:00:00Z',
    is_default: false,
  },
];

export const mockCreationPayload = {
  household_id: 'household-123',
  user_id: 'user-456',
  user_label: 'My Test Household',
  country_id: 'us',
  is_default: false,
};
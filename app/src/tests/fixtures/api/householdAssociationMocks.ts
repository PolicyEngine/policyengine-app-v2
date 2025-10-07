import { CURRENT_YEAR } from '@/constants';
import { UserHouseholdPopulation } from '@/types/ingredients/UserPopulation';

export const mockUserHouseholdPopulation: UserHouseholdPopulation = {
  type: 'household',
  id: '123',
  householdId: '123',
  userId: 'user-456',
  label: 'My Test Household',
  createdAt: `${CURRENT_YEAR}-01-15T10:00:00Z`,
  updatedAt: `${CURRENT_YEAR}-01-15T10:00:00Z`,
  isCreated: true,
} as any;

export const mockUserHouseholdPopulationList: UserHouseholdPopulation[] = [
  {
    type: 'household',
    id: '1',
    householdId: '1',
    userId: 'user-456',
    label: 'First Household',
    createdAt: `${CURRENT_YEAR}-01-10T10:00:00Z`,
    updatedAt: `${CURRENT_YEAR}-01-10T10:00:00Z`,
    isCreated: true,
  } as any,
  {
    type: 'household',
    id: '2',
    householdId: '2',
    userId: 'user-456',
    label: 'Second Household',
    createdAt: `${CURRENT_YEAR}-01-12T10:00:00Z`,
    updatedAt: `${CURRENT_YEAR}-01-12T10:00:00Z`,
    isCreated: true,
  } as any,
];

export const mockApiResponse = {
  id: '123',
  household_id: '123',
  user_id: 'user-456',
  user_label: 'My Test Household',
  country_id: 'us',
  created_at: `${CURRENT_YEAR}-01-15T10:00:00Z`,
  updated_at: `${CURRENT_YEAR}-01-15T10:00:00Z`,
  is_default: false,
};

export const mockApiResponseList = [
  {
    id: '1',
    household_id: '1',
    user_id: 'user-456',
    user_label: 'First Household',
    country_id: 'us',
    created_at: `${CURRENT_YEAR}-01-10T10:00:00Z`,
    updated_at: `${CURRENT_YEAR}-01-10T10:00:00Z`,
    is_default: true,
  },
  {
    id: '2',
    household_id: '2',
    user_id: 'user-456',
    user_label: 'Second Household',
    country_id: 'uk',
    created_at: `${CURRENT_YEAR}-01-12T10:00:00Z`,
    updated_at: `${CURRENT_YEAR}-01-12T10:00:00Z`,
    is_default: false,
  },
];

export const mockCreationPayload = {
  household_id: '123',
  user_id: 'user-456',
  user_label: 'My Test Household',
  country_id: 'us',
  is_default: false,
};

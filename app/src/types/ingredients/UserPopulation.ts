import { countryIds } from '@/libs/countries';

/**
 * UserPopulation type for household associations.
 * Geographic areas are selected directly without user-specific associations.
 */

interface BaseUserPopulation {
  id?: string;
  userId: string;
  label?: string;
  createdAt?: string;
  updatedAt?: string;
  isCreated?: boolean;
}

export interface UserHouseholdPopulation extends BaseUserPopulation {
  type: 'household';
  householdId: string;
  countryId: (typeof countryIds)[number];
}

export type UserPopulation = UserHouseholdPopulation;

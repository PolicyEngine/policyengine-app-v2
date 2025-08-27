/**
 * UserPopulation type using discriminated union for Household and Geography
 * This allows users to associate with either a household or geographic area
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
}

export interface UserGeographyPopulation extends BaseUserPopulation {
  type: 'geography';
  geographyId: string; // References Geography.id
  countryId: string;
  scope: 'national' | 'subnational';
}

export type UserPopulation = UserHouseholdPopulation | UserGeographyPopulation;

import { countryIds } from '@/libs/countries';

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
  countryId: (typeof countryIds)[number];
}

export interface UserGeographyPopulation extends BaseUserPopulation {
  type: 'geography';
  geographyId: string; // References Geography.geographyId
  // For UK: ALWAYS includes prefix ("constituency/Sheffield Central", "country/england")
  // For US: New format ALWAYS includes prefix ("state/ca", "congressional_district/CA-01");
  // previously could be just state code ("ca"); this supports both
  // National: Just country code ("uk", "us")
  countryId: (typeof countryIds)[number];
  scope: 'national' | 'subnational';
}

export type UserPopulation = UserHouseholdPopulation | UserGeographyPopulation;

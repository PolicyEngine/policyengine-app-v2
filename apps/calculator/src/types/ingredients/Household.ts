import { countryIds } from '@/libs/countries';

/**
 * Household - The canonical household data structure for API communication
 * This represents the actual household data structure used for simulations
 *
 * Use this for:
 * - API requests/responses
 * - Simulation data
 * - Data persistence
 * - Normalized cache storage
 *
 * Key principles:
 * - No ID until created via API
 * - Country-agnostic structure
 * - All group entities use same interface
 */
export interface Household {
  id?: string; // Only present after API creation
  countryId: (typeof countryIds)[number];
  householdData: HouseholdData;
}

/**
 * The core household data structure matching API expectations
 * All group entities (families, taxUnits, etc.) use the same interface
 * The specific entities present depend on the country
 */
export interface HouseholdData {
  people: Record<string, HouseholdPerson>;
  [groupEntity: string]: Record<string, HouseholdGroupEntity> | Record<string, HouseholdPerson>;
}

/**
 * Person entity - can contain any variables
 */
export interface HouseholdPerson {
  [key: string]: any;
}

/**
 * Group entity used for families, tax units, households, etc.
 * Must have members array, can contain any other variables
 */
export interface HouseholdGroupEntity {
  members: string[];
  [key: string]: any;
}

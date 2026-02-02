/**
 * HouseholdQueries - Query utilities for API v2 Alpha household structure
 *
 * Entity groups are single flat dicts (not arrays).
 * People are identified by array index (no person_id or name).
 * All people belong to every entity group (server handles membership).
 */

import { EntityType, Household, HouseholdPerson } from '@/types/ingredients/Household';

// ============================================================================
// Person Queries
// ============================================================================

/**
 * Get all people in the household
 */
export function getAllPeople(household: Household): HouseholdPerson[] {
  return household.people;
}

/**
 * Get a person by array index
 */
export function getPersonByIndex(household: Household, index: number): HouseholdPerson | undefined {
  return household.people[index];
}

/**
 * Get all adults (age >= 18 or not a dependent)
 */
export function getAdults(household: Household): HouseholdPerson[] {
  return household.people.filter((p) => (p.age ?? 0) >= 18);
}

/**
 * Get all children (age < 18)
 */
export function getChildren(household: Household): HouseholdPerson[] {
  return household.people.filter((p) => (p.age ?? 0) < 18);
}

/**
 * Get the total number of people
 */
export function getPersonCount(household: Household): number {
  return household.people.length;
}

/**
 * Get the number of adults
 */
export function getAdultCount(household: Household): number {
  return getAdults(household).length;
}

/**
 * Get the number of children
 */
export function getChildCount(household: Household): number {
  return getChildren(household).length;
}

/**
 * Check if household has any people
 */
export function isEmpty(household: Household): boolean {
  return household.people.length === 0;
}

/**
 * Check if household has people
 */
export function hasPeople(household: Household): boolean {
  return household.people.length > 0;
}

// ============================================================================
// Variable Access
// ============================================================================

/**
 * Get a variable value for a person by array index
 */
export function getPersonVariable(
  household: Household,
  personIndex: number,
  variableName: string
): number | boolean | string | undefined {
  const person = household.people[personIndex];
  if (!person) {
    return undefined;
  }
  return person[variableName];
}

/**
 * Get a variable value for all people
 * Returns array of [index, value] pairs
 */
export function getPersonVariableAll(
  household: Household,
  variableName: string
): Array<[number, number | boolean | string | undefined]> {
  return household.people.map((p, index) => [index, p[variableName]]);
}

/**
 * Set a variable on a person by array index (mutates household)
 */
export function setPersonVariable(
  household: Household,
  personIndex: number,
  variableName: string,
  value: number | boolean | string
): void {
  const person = household.people[personIndex];
  if (person) {
    person[variableName] = value;
  }
}

// ============================================================================
// Entity Queries - Single dict access
// ============================================================================

/**
 * Get entity dict by entity type.
 * For 'person' returns the people array; for others returns the single dict.
 */
export function getEntityByType(
  household: Household,
  entityType: EntityType
): Record<string, any> | undefined {
  if (entityType === 'person') {
    // People are an array, not a single dict - callers should use getAllPeople
    return undefined;
  }
  return household[entityType as keyof Household] as Record<string, any> | undefined;
}

/**
 * Get a variable from an entity (single dict access, no entityId needed)
 */
export function getEntityVariable(
  household: Household,
  entityType: EntityType,
  variableName: string
): number | boolean | string | undefined {
  if (entityType === 'person') {
    // For person, get from first person
    return household.people[0]?.[variableName];
  }
  const entity = household[entityType as keyof Household] as Record<string, any> | undefined;
  return entity?.[variableName];
}

/**
 * Get the household unit dict
 */
export function getHouseholdUnit(household: Household): Record<string, any> | undefined {
  return household.household;
}

// ============================================================================
// Household-Level Queries
// ============================================================================

/**
 * Get the simulation year
 */
export function getYear(household: Household): number {
  return household.year;
}

/**
 * Get the tax-benefit model name
 */
export function getModelName(household: Household): string {
  return household.tax_benefit_model_name;
}

/**
 * Check if this is a US household
 */
export function isUSHousehold(household: Household): boolean {
  return household.tax_benefit_model_name === 'policyengine_us';
}

/**
 * Check if this is a UK household
 */
export function isUKHousehold(household: Household): boolean {
  return household.tax_benefit_model_name === 'policyengine_uk';
}

/**
 * Get the state FIPS code (US only)
 */
export function getStateFips(household: Household): number | undefined {
  return household.household?.state_fips;
}

/**
 * Get the state code (US only)
 */
export function getStateCode(household: Household): string | undefined {
  return household.tax_unit?.state_code;
}

/**
 * Get the region (UK only)
 */
export function getRegion(household: Household): string | undefined {
  return household.household?.region;
}

// ============================================================================
// Summary/Aggregation Queries
// ============================================================================

/**
 * Sum a numeric variable across all people
 */
export function sumPersonVariable(household: Household, variableName: string): number {
  return household.people.reduce((sum, person) => {
    const value = person[variableName];
    return sum + (typeof value === 'number' ? value : 0);
  }, 0);
}

/**
 * Get the average of a numeric variable across all people
 */
export function avgPersonVariable(household: Household, variableName: string): number {
  if (household.people.length === 0) {
    return 0;
  }
  return sumPersonVariable(household, variableName) / household.people.length;
}

/**
 * Get the minimum of a numeric variable across all people
 */
export function minPersonVariable(household: Household, variableName: string): number | undefined {
  const values = household.people
    .map((p) => p[variableName])
    .filter((v): v is number => typeof v === 'number');
  return values.length > 0 ? Math.min(...values) : undefined;
}

/**
 * Get the maximum of a numeric variable across all people
 */
export function maxPersonVariable(household: Household, variableName: string): number | undefined {
  const values = household.people
    .map((p) => p[variableName])
    .filter((v): v is number => typeof v === 'number');
  return values.length > 0 ? Math.max(...values) : undefined;
}

/**
 * Get total employment income across all people
 */
export function getTotalEmploymentIncome(household: Household): number {
  return sumPersonVariable(household, 'employment_income');
}

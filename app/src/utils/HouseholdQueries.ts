import { Household, HouseholdGroupEntity, HouseholdPerson } from '@/types/ingredients/Household';

/**
 * Extended person type with name (not ID - people don't have IDs)
 */
export interface PersonWithName extends HouseholdPerson {
  name: string;
}

/**
 * Get all people in the household
 */
export function getAllPeople(household: Household): PersonWithName[] {
  return Object.entries(household.householdData.people).map(([name, person]) => ({
    name,
    ...person,
  }));
}

/**
 * Get all adults (age >= 18) for a specific year
 * Note: Year is required - no assumptions about current year
 */
export function getAdults(household: Household, year: string): PersonWithName[] {
  return Object.entries(household.householdData.people)
    .filter(([, person]) => {
      const age = person.age?.[year];
      return age !== undefined && age >= 18;
    })
    .map(([name, person]) => ({ name, ...person }));
}

/**
 * Get all children (age < 18) for a specific year
 * Note: Year is required - no assumptions about current year
 */
export function getChildren(household: Household, year: string): PersonWithName[] {
  return Object.entries(household.householdData.people)
    .filter(([, person]) => {
      const age = person.age?.[year];
      return age !== undefined && age < 18;
    })
    .map(([name, person]) => ({ name, ...person }));
}

/**
 * Get variable value for a person
 * Year is required - no fallback to current year
 */
export function getPersonVariable(
  household: Household,
  personName: string,
  variableName: string,
  year: string
): any {
  const person = household.householdData.people[personName];
  if (!person) {
    return undefined;
  }

  const variable = person[variableName];
  if (typeof variable === 'object' && variable !== null && year in variable) {
    return variable[year];
  }
  return undefined;
}

/**
 * Get variable value for a group entity
 * Year is required - no fallback to current year
 */
export function getGroupVariable(
  household: Household,
  entityName: string,
  groupKey: string,
  variableName: string,
  year: string
): any {
  const entities = household.householdData[entityName] as
    | Record<string, HouseholdGroupEntity>
    | undefined;
  if (!entities) {
    return undefined;
  }

  const group = entities[groupKey];
  if (!group) {
    return undefined;
  }

  const variable = group[variableName];
  if (typeof variable === 'object' && variable !== null && year in variable) {
    return variable[year];
  }
  return undefined;
}

/**
 * Count total people in household
 */
export function getPersonCount(household: Household): number {
  return Object.keys(household.householdData.people).length;
}

/**
 * Count adults in household for a specific year
 */
export function getAdultCount(household: Household, year: string): number {
  return getAdults(household, year).length;
}

/**
 * Count children in household for a specific year
 */
export function getChildCount(household: Household, year: string): number {
  return getChildren(household, year).length;
}

/**
 * Check if household has any people
 */
export function isEmpty(household: Household): boolean {
  return Object.keys(household.householdData.people).length === 0;
}

/**
 * Get members of a specific group
 */
export function getGroupMembers(
  household: Household,
  entityName: string,
  groupKey: string
): string[] {
  const entities = household.householdData[entityName] as
    | Record<string, HouseholdGroupEntity>
    | undefined;
  if (!entities) {
    return [];
  }

  const group = entities[groupKey];
  return group?.members || [];
}

/**
 * Get all groups of a specific entity type
 */
export function getGroups(
  household: Household,
  entityName: string
): Array<{ key: string; members: string[] }> {
  const entities = household.householdData[entityName] as
    | Record<string, HouseholdGroupEntity>
    | undefined;
  if (!entities) {
    return [];
  }

  return Object.entries(entities).map(([key, group]) => ({ key, members: group.members }));
}

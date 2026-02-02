/**
 * householdVariationAxes - Variation axes for API v2 Alpha household structure
 *
 * Builds axes configuration for household variation calculations.
 * People are identified by array index.
 */

import { Household, HouseholdPerson } from '@/types/ingredients/Household';

/**
 * Axis configuration for variation calculations
 */
export interface VariationAxis {
  name: string;
  min: number;
  max: number;
  count: number;
}

/**
 * Household with axes for variation calculation
 */
export interface HouseholdWithAxes extends Household {
  axes: VariationAxis[][];
}

/**
 * Builds axes configuration for household variation calculations
 * Sets employment_income to null for the target person and adds axes array
 *
 * @param household - The household data structure (v2 format)
 * @param personIndex - The array index of the person to vary employment income for (default: 0)
 * @returns Household data with axes configuration for calculate-full endpoint
 */
export function buildHouseholdVariationAxes(
  household: Household,
  personIndex = 0
): HouseholdWithAxes {
  // Validate household has people
  if (!household.people || household.people.length === 0) {
    throw new Error('Household has no people defined');
  }

  // Validate person index
  if (personIndex < 0 || personIndex >= household.people.length) {
    throw new Error(`Person at index ${personIndex} not found`);
  }

  const person = household.people[personIndex];

  // Get current earnings for max calculation
  const currentEarnings = person.employment_income ?? 0;

  // Calculate max earnings based on model
  const maxEarnings = Math.max(200_000, 2 * currentEarnings);

  // Build household with nulled employment_income for the target person
  const modifiedPeople: HouseholdPerson[] = household.people.map((p, index) => {
    if (index === personIndex) {
      // Create a copy without employment_income (will be varied)
      const { employment_income: _, ...restPerson } = p;
      return restPerson as HouseholdPerson;
    }
    return p;
  });

  // Return household with axes configuration
  return {
    ...household,
    people: modifiedPeople,
    axes: [
      [
        {
          name: 'employment_income',
          min: 0,
          max: maxEarnings,
          count: 401,
        },
      ],
    ],
  };
}

/**
 * Build variation axes for a specific variable
 */
export function buildVariationAxesForVariable(
  household: Household,
  variableName: string,
  personIndex: number,
  min: number,
  max: number,
  count = 401
): HouseholdWithAxes {
  // Validate person index
  if (personIndex < 0 || personIndex >= household.people.length) {
    throw new Error(`Person at index ${personIndex} not found`);
  }

  // Build household with nulled variable for the target person
  const modifiedPeople: HouseholdPerson[] = household.people.map((p, index) => {
    if (index === personIndex) {
      const personCopy = { ...p };
      delete personCopy[variableName];
      return personCopy;
    }
    return p;
  });

  return {
    ...household,
    people: modifiedPeople,
    axes: [
      [
        {
          name: variableName,
          min,
          max,
          count,
        },
      ],
    ],
  };
}

/**
 * Build multi-dimensional variation axes
 */
export function buildMultiDimensionalAxes(
  household: Household,
  axes: Array<{
    variableName: string;
    personIndex: number;
    min: number;
    max: number;
    count?: number;
  }>
): HouseholdWithAxes {
  // Build household with all specified variables nulled
  const modifiedPeople: HouseholdPerson[] = household.people.map((p, index) => {
    const personCopy = { ...p };
    for (const axis of axes) {
      if (index === axis.personIndex) {
        delete personCopy[axis.variableName];
      }
    }
    return personCopy;
  });

  // Build axes array
  const axesConfig: VariationAxis[][] = axes.map((axis) => [
    {
      name: axis.variableName,
      min: axis.min,
      max: axis.max,
      count: axis.count ?? 401,
    },
  ]);

  return {
    ...household,
    people: modifiedPeople,
    axes: axesConfig,
  };
}

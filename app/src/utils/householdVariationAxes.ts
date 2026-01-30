/**
 * householdVariationAxes - Variation axes for API v2 Alpha household structure
 *
 * Builds axes configuration for household variation calculations.
 * Works with the array-based household structure with flat values.
 */

import { Household, HouseholdPerson } from '@/types/ingredients/Household';
import * as HouseholdQueries from './HouseholdQueries';

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
 * Sets employment_income to null for the first person and adds axes array
 *
 * @param household - The household data structure (v2 format)
 * @param personId - The person ID to vary employment income for (default: 0)
 * @returns Household data with axes configuration for calculate-full endpoint
 */
export function buildHouseholdVariationAxes(household: Household, personId = 0): HouseholdWithAxes {
  // Validate household has people
  if (!household.people || household.people.length === 0) {
    throw new Error('Household has no people defined');
  }

  // Find the person to vary
  const person = household.people.find((p) => p.person_id === personId);
  if (!person) {
    throw new Error(`Person with ID ${personId} not found`);
  }

  // Get current earnings for max calculation
  const currentEarnings = person.employment_income ?? 0;

  // Calculate max earnings based on model
  const maxEarnings = Math.max(200_000, 2 * currentEarnings);

  // Build household with nulled employment_income for the target person
  const modifiedPeople: HouseholdPerson[] = household.people.map((p) => {
    if (p.person_id === personId) {
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
  personId: number,
  min: number,
  max: number,
  count = 401
): HouseholdWithAxes {
  // Find the person
  const person = household.people.find((p) => p.person_id === personId);
  if (!person) {
    throw new Error(`Person with ID ${personId} not found`);
  }

  // Build household with nulled variable for the target person
  const modifiedPeople: HouseholdPerson[] = household.people.map((p) => {
    if (p.person_id === personId) {
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
    personId: number;
    min: number;
    max: number;
    count?: number;
  }>
): HouseholdWithAxes {
  // Build household with all specified variables nulled
  const modifiedPeople: HouseholdPerson[] = household.people.map((p) => {
    const personCopy = { ...p };
    for (const axis of axes) {
      if (p.person_id === axis.personId) {
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

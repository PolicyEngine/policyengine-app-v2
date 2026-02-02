/**
 * householdTableData - Table data extraction for API v2 Alpha household structure
 *
 * People are identified by array index.
 * Entity groups are single flat dicts (not arrays).
 */

import { EntityType, Household } from '@/types/ingredients/Household';
import { getPersonDisplayNameInContext } from './householdIndividuals';
import * as HouseholdQueries from './HouseholdQueries';

export interface HouseholdInputRow {
  category: string;
  label: string;
  paramName: string;
  value: any;
  entityType: EntityType;
  entityId: number; // for person: array index; for entities: 0
}

/**
 * Extract household input values as structured table rows
 */
export function extractHouseholdInputs(household: Household): HouseholdInputRow[] {
  const rows: HouseholdInputRow[] = [];

  // Extract person-level inputs
  for (let index = 0; index < household.people.length; index++) {
    const person = household.people[index];
    const personName = getPersonDisplayNameInContext(household.people, index);
    const capitalizedName = personName.charAt(0).toUpperCase() + personName.slice(1);

    for (const [paramName, value] of Object.entries(person)) {
      if (value === undefined) {
        continue;
      }

      rows.push({
        category: capitalizedName,
        label: formatParameterLabel(paramName),
        paramName,
        value,
        entityType: 'person',
        entityId: index,
      });
    }
  }

  // Extract household unit inputs (single dict)
  if (household.household && typeof household.household === 'object') {
    for (const [paramName, value] of Object.entries(household.household)) {
      if (value === undefined) {
        continue;
      }

      rows.push({
        category: 'Household',
        label: formatParameterLabel(paramName),
        paramName,
        value,
        entityType: 'household',
        entityId: 0,
      });
    }
  }

  // Extract tax unit inputs (US, single dict)
  if (household.tax_unit && typeof household.tax_unit === 'object') {
    for (const [paramName, value] of Object.entries(household.tax_unit)) {
      if (value === undefined) {
        continue;
      }

      rows.push({
        category: 'Tax unit',
        label: formatParameterLabel(paramName),
        paramName,
        value,
        entityType: 'tax_unit',
        entityId: 0,
      });
    }
  }

  // Extract benefit unit inputs (UK, single dict)
  if (household.benunit && typeof household.benunit === 'object') {
    for (const [paramName, value] of Object.entries(household.benunit)) {
      if (value === undefined) {
        continue;
      }

      rows.push({
        category: 'Benefit unit',
        label: formatParameterLabel(paramName),
        paramName,
        value,
        entityType: 'benunit',
        entityId: 0,
      });
    }
  }

  return rows;
}

/**
 * Format parameter name to human-readable label
 * Converts snake_case to sentence case
 */
function formatParameterLabel(paramName: string): string {
  const words = paramName.split('_');
  return words
    .map((word, index) => {
      if (index === 0) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      }
      return word.toLowerCase();
    })
    .join(' ');
}

/**
 * Check if two households are structurally equal
 */
export function householdsAreEqual(
  household1: Household | undefined,
  household2: Household | undefined
): boolean {
  if (!household1 || !household2) {
    return false;
  }
  if (household1.id === household2.id) {
    return true;
  }

  // Compare key fields
  if (household1.tax_benefit_model_name !== household2.tax_benefit_model_name) {
    return false;
  }
  if (household1.year !== household2.year) {
    return false;
  }
  if (household1.people.length !== household2.people.length) {
    return false;
  }

  // Deep comparison of household data (excluding metadata fields)
  const stripMeta = (h: Household) => {
    const { id, label, ...data } = h;
    return data;
  };
  return JSON.stringify(stripMeta(household1)) === JSON.stringify(stripMeta(household2));
}

/**
 * Get a summary of the household for display
 */
export function getHouseholdSummary(household: Household): {
  personCount: number;
  adultCount: number;
  childCount: number;
  year: number;
  model: string;
} {
  return {
    personCount: HouseholdQueries.getPersonCount(household),
    adultCount: HouseholdQueries.getAdultCount(household),
    childCount: HouseholdQueries.getChildCount(household),
    year: household.year,
    model: household.tax_benefit_model_name,
  };
}

/**
 * Extract people as table rows
 */
export function extractPeopleRows(household: Household): Array<{
  id: number;
  name: string;
  age: number | undefined;
  isAdult: boolean;
}> {
  return household.people.map((person, index) => ({
    id: index,
    name: getPersonDisplayNameInContext(household.people, index),
    age: person.age,
    isAdult: (person.age ?? 0) >= 18,
  }));
}

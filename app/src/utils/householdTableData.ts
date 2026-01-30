/**
 * householdTableData - Table data extraction for API v2 Alpha household structure
 *
 * These functions extract household data for display in table format.
 * Works with the array-based household structure with flat values.
 */

import { EntityType, Household, HouseholdPerson } from '@/types/ingredients/Household';
import * as HouseholdQueries from './HouseholdQueries';

export interface HouseholdInputRow {
  category: string;
  label: string;
  paramName: string;
  value: any;
  entityType: EntityType;
  entityId: number;
}

/**
 * Extract household input values as structured table rows
 */
export function extractHouseholdInputs(household: Household): HouseholdInputRow[] {
  const rows: HouseholdInputRow[] = [];

  // Extract person-level inputs
  for (const person of household.people) {
    const personName = person.name ?? `Person ${(person.person_id ?? 0) + 1}`;

    for (const [paramName, value] of Object.entries(person)) {
      // Skip ID fields, name, and undefined values
      if (
        paramName === 'person_id' ||
        paramName === 'name' ||
        paramName.startsWith('person_') ||
        value === undefined
      )
        continue;

      rows.push({
        category: personName,
        label: formatParameterLabel(paramName),
        paramName,
        value,
        entityType: 'person',
        entityId: person.person_id ?? 0,
      });
    }
  }

  // Extract household unit inputs
  if (household.household) {
    for (const unit of household.household) {
      for (const [paramName, value] of Object.entries(unit)) {
        if (paramName === 'household_id' || value === undefined) continue;

        rows.push({
          category: 'Household',
          label: formatParameterLabel(paramName),
          paramName,
          value,
          entityType: 'household',
          entityId: unit.household_id ?? 0,
        });
      }
    }
  }

  // Extract tax unit inputs (US)
  if (household.tax_unit) {
    for (const unit of household.tax_unit) {
      for (const [paramName, value] of Object.entries(unit)) {
        if (paramName === 'tax_unit_id' || value === undefined) continue;

        rows.push({
          category: 'Tax unit',
          label: formatParameterLabel(paramName),
          paramName,
          value,
          entityType: 'tax_unit',
          entityId: unit.tax_unit_id ?? 0,
        });
      }
    }
  }

  // Extract benefit unit inputs (UK)
  if (household.benunit) {
    for (const unit of household.benunit) {
      for (const [paramName, value] of Object.entries(unit)) {
        if (paramName === 'benunit_id' || value === undefined) continue;

        rows.push({
          category: 'Benefit unit',
          label: formatParameterLabel(paramName),
          paramName,
          value,
          entityType: 'benunit',
          entityId: unit.benunit_id ?? 0,
        });
      }
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
  return household.people.map((person) => ({
    id: person.person_id ?? 0,
    name: person.name ?? `Person ${(person.person_id ?? 0) + 1}`,
    age: person.age,
    isAdult: (person.age ?? 0) >= 18,
  }));
}

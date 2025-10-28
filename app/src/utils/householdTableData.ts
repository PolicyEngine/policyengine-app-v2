import { Household } from '@/types/ingredients/Household';

export interface HouseholdInputRow {
  category: string; // "Person 1", "Household", etc.
  label: string; // "Age", "Employment Income"
  paramName: string; // "age", "employment_income"
  value: any;
}

/**
 * Extract household input values as structured table rows
 */
export function extractHouseholdInputs(household: Household): HouseholdInputRow[] {
  const rows: HouseholdInputRow[] = [];

  if (!household.householdData) {
    return rows;
  }

  const { people, households: householdVars } = household.householdData;

  // Extract person-level inputs
  if (people) {
    Object.entries(people).forEach(([personId, personData]) => {
      // For each parameter in person data
      Object.entries(personData).forEach(([paramName, paramValues]) => {
        // paramValues is typically { "2024": value, "2025": value, ... }
        if (typeof paramValues === 'object' && paramValues !== null) {
          const firstValue = Object.values(paramValues)[0];

          rows.push({
            category: personId,
            label: formatParameterLabel(paramName),
            paramName,
            value: firstValue,
          });
        }
      });
    });
  }

  // Extract household-level inputs
  // householdVars is a Record<string, HouseholdGroupEntity>
  // Each entity has a members array and other parameters
  if (householdVars) {
    Object.entries(householdVars).forEach(([_householdId, householdEntity]) => {
      if (typeof householdEntity === 'object' && householdEntity !== null) {
        Object.entries(householdEntity).forEach(([paramName, paramValues]) => {
          // Skip the 'members' array - it's metadata, not an input
          if (paramName === 'members') {
            return;
          }

          if (typeof paramValues === 'object' && paramValues !== null) {
            const firstValue = Object.values(paramValues)[0];

            rows.push({
              category: 'Household',
              label: formatParameterLabel(paramName),
              paramName,
              value: firstValue,
            });
          }
        });
      }
    });
  }

  return rows;
}

/**
 * Format parameter name to human-readable label
 */
function formatParameterLabel(paramName: string): string {
  // Convert snake_case to Title Case
  return paramName
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
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

  // Deep comparison of householdData
  return JSON.stringify(household1.householdData) === JSON.stringify(household2.householdData);
}

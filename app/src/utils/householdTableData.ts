import type { Household } from '@/models/Household';

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
  return household.getHouseholdInputVariableEntries().map((entry) => ({
    category: entry.entity === 'people' ? entry.entityName : 'Household',
    label: formatParameterLabel(entry.name),
    paramName: entry.name,
    value: entry.value,
  }));
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
 * Check if two native household model instances are equal.
 */
export function householdsAreEqual(
  household1: Household | undefined,
  household2: Household | undefined
): boolean {
  if (!household1 || !household2) {
    return false;
  }

  return household1.isEqual(household2);
}

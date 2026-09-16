import type { Household } from '@/models/Household';

export interface HouseholdInputRow {
  category: string; // "Person 1", "Household", etc.
  label: string; // "Age", "Employment income"
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
  const label = paramName.replace(/_/g, ' ');
  return label.charAt(0).toUpperCase() + label.slice(1);
}

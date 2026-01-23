/**
 * Metadata utility functions and selectors.
 *
 * Note: The following are now available from other modules:
 * - getTaxYears() - pure function from @/data/static
 * - getDateRange() - pure function from @/data/static
 * - getRegions/useRegionsList() - from @/hooks/useStaticMetadata
 * - useBasicInputFields() - hook from @/hooks/useBasicInputFields (combines static + Redux data)
 */
import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@/store';

// For field options, we need a function that takes fieldName as parameter
// We'll use a factory function that returns a memoized selector
export const makeGetFieldOptions = () =>
  createSelector(
    (state: RootState, fieldName: string) => ({
      variables: state.metadata.variables,
      fieldName,
    }),
    ({ variables, fieldName }) => {
      // Get field variable from metadata
      const fieldVariable = variables?.[fieldName];

      // Check if the variable has possible_values
      if (fieldVariable && fieldVariable.possible_values) {
        // Handle array format (V2 API returns string[])
        if (Array.isArray(fieldVariable.possible_values)) {
          return fieldVariable.possible_values.map((value: string) => ({
            value,
            label: value,
          }));
        }
        // Handle Record format (legacy/V1 format: { value: label })
        if (typeof fieldVariable.possible_values === 'object') {
          return Object.entries(fieldVariable.possible_values).map(([value, label]) => ({
            value,
            label: String(label),
          }));
        }
      }

      // Fallback for fields without metadata
      return [];
    }
  );

// Create a single instance of the field options selector
const getFieldOptionsSelector = makeGetFieldOptions();

// Helper function to get field options for a specific field
export const getFieldOptions = (state: RootState, fieldName: string) => {
  return getFieldOptionsSelector(state, fieldName);
};

// Check if a field should be a dropdown based on metadata
// Accepts both array format (string[]) and record format (Record<string, string>)
export const isDropdownField = (state: RootState, fieldName: string): boolean => {
  const fieldVariable = state.metadata.variables?.[fieldName];
  return !!(
    fieldVariable &&
    fieldVariable.possible_values &&
    (Array.isArray(fieldVariable.possible_values) ||
      typeof fieldVariable.possible_values === 'object')
  );
};

// Get user-friendly label for field
export const getFieldLabel = (fieldName: string) => {
  const labelMap: Record<string, string> = {
    state_name: 'State',
    region: 'Region',
    brma: 'Broad Rental Market Area',
    local_authority: 'Local Authority',
    age: 'Age',
    employment_income: 'Employment Income',
  };

  return (
    labelMap[fieldName] || fieldName.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
  );
};

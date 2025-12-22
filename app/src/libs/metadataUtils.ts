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
import { MetadataApiPayload, MetadataState } from '@/types/metadata';

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

      // Check if the variable has possibleValues (array format from API)
      if (
        fieldVariable &&
        fieldVariable.possibleValues &&
        Array.isArray(fieldVariable.possibleValues)
      ) {
        return fieldVariable.possibleValues.map((option: { value: string; label: string }) => ({
          value: option.value,
          label: option.label,
        }));
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
export const isDropdownField = (state: RootState, fieldName: string): boolean => {
  const fieldVariable = state.metadata.variables?.[fieldName];
  return !!(
    fieldVariable &&
    fieldVariable.possibleValues &&
    Array.isArray(fieldVariable.possibleValues)
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

/**
 * Transform API payload to MetadataState format
 * Note: Static data (entities, basicInputs, economyOptions, etc.) is now handled separately
 * via static files in src/data/static/
 */
export function transformMetadataPayload(
  payload: MetadataApiPayload,
  country: string
): MetadataState {
  const data = payload.result;
  return {
    currentCountry: country,
    // V2 tiered loading states (default to false for V1 transform)
    coreLoading: false,
    coreLoaded: false,
    coreError: null,
    parametersLoading: false,
    parametersLoaded: false,
    parametersError: null,
    progress: 100, // Transformation happens after successful load
    variables: data.variables ?? {},
    parameters: data.parameters ?? {},
    datasets: data.economy_options?.datasets ?? [],
    version: data.version ?? null,
    parameterTree: null, // Will be built separately in the reducer
  };
}

import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@/store';
import { MetadataApiPayload, MetadataState } from '@/types/metadata';

// Memoized selectors to prevent unnecessary re-renders
export const getTaxYears = createSelector(
  (state: RootState) => state.metadata.economyOptions.time_period,
  (timePeriods) =>
    timePeriods?.map((tp) => ({
      value: tp.name.toString(),
      label: tp.label,
    })) || []
);

export const getDateRange = createSelector(
  (state: RootState) => state.metadata.economyOptions.time_period,
  (timePeriods) => {
    if (!timePeriods || timePeriods.length === 0) {
      return {
        minDate: '2022-01-01',
        maxDate: '2035-12-31',
      };
    }

    // Calculate min/max dates from metadata.economy_options.time_period (following V1 approach)
    const possibleYears = timePeriods.map((period) => period.name).sort();

    return {
      minDate: `${possibleYears[0]}-01-01`,
      maxDate: `${possibleYears[possibleYears.length - 1]}-12-31`,
    };
  }
);

export const getRegions = createSelector(
  (state: RootState) => state.metadata.economyOptions.region,
  (regions) =>
    regions?.map((region) => ({
      value: region.name,
      label: region.label,
    })) || []
);

export const getBasicInputFields = createSelector(
  [
    (state: RootState) => state.metadata.basicInputs,
    (state: RootState) => state.metadata.variables,
    (state: RootState) => state.metadata.entities,
  ],
  (basicInputs, variables, entities) => {
    const inputs = basicInputs || [];

    // Categorize fields by their actual entity from metadata
    const categorized: Record<string, string[]> = {
      person: [],
      household: [],
      taxUnit: [],
      spmUnit: [],
      family: [],
      maritalUnit: [],
    };

    for (const field of inputs) {
      const variable = variables?.[field];
      if (!variable) continue;

      const entityType = variable.entity;
      const entityInfo = entities?.[entityType];

      // Map entity to category
      if (entityInfo?.is_person || entityType === 'person') {
        categorized.person.push(field);
      } else if (entityType === 'household') {
        categorized.household.push(field);
      } else if (entityType === 'tax_unit') {
        categorized.taxUnit.push(field);
      } else if (entityType === 'spm_unit') {
        categorized.spmUnit.push(field);
      } else if (entityType === 'family') {
        categorized.family.push(field);
      } else if (entityType === 'marital_unit') {
        categorized.maritalUnit.push(field);
      } else {
        // Default to household for unknown entities
        categorized.household.push(field);
      }
    }

    return categorized;
  }
);

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

export function transformMetadataPayload(
  payload: MetadataApiPayload,
  country: string
): Omit<MetadataState, 'loading' | 'error' | 'lastFetched'> {
  const data = payload.result;
  return {
    currentCountry: country,
    variables: data.variables ?? {},
    parameters: data.parameters ?? {},
    entities: data.entities ?? {},
    variableModules: data.variableModules ?? {},
    economyOptions: data.economy_options ?? { region: [], time_period: [], datasets: [] },
    currentLawId: data.current_law_id ?? 0,
    basicInputs: data.basicInputs ?? [],
    modelledPolicies: data.modelled_policies ?? { core: {}, filtered: {} },
    version: data.version ?? null,
    parameterTree: null, // Will be built separately in the reducer
  };
}

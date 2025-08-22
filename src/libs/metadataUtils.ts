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
  (state: RootState) => state.metadata.basicInputs,
  (basicInputs) => {
    const inputs = basicInputs || [];

    // Person-level fields that apply to each individual
    const personFields = inputs.filter((field) => ['age', 'employment_income'].includes(field));

    // Household-level fields that apply once per household
    const householdFields = inputs.filter((field) => !['age', 'employment_income'].includes(field));

    return {
      person: personFields,
      household: householdFields,
    };
  }
);

// For field options, we need a function that takes fieldName as parameter
// We'll use a factory function that returns a memoized selector
export const makeGetFieldOptions = () =>
  createSelector(
    (state: RootState, fieldName: string) => ({
      regions: state.metadata.economyOptions.region,
      variables: state.metadata.variables,
      fieldName,
    }),
    ({ regions, variables, fieldName }) => {
      // For region-based fields, use regions from economy options
      if (fieldName === 'state_name' || fieldName === 'region') {
        return (
          regions?.map((region) => ({
            value: region.name,
            label: region.label,
          })) || []
        );
      }

      // For other fields, try to find options in variables metadata
      const fieldVariable = variables?.[fieldName];

      if (fieldVariable && fieldVariable.possible_values) {
        return Object.entries(fieldVariable.possible_values).map(([value, label]) => ({
          value,
          label: typeof label === 'string' ? label : value,
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

// Check if a field should be a dropdown
export const isDropdownField = (fieldName: string) => {
  return ['state_name', 'region', 'brma', 'local_authority'].includes(fieldName);
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

import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@/store';
import { MetadataApiPayload, MetadataState } from '@/types/metadata';

// Memoized selectors to prevent unnecessary re-renders
export const getTaxYears = createSelector(
  (state: RootState) => state.metadata.economyOptions.time_period,
  (timePeriods) => {
    if (!timePeriods) {
      return [];
    }

    // Sort by year in ascending order (2025, 2026, 2027, etc.)
    return timePeriods
      .map((tp) => ({
        value: tp.name.toString(),
        label: tp.label,
      }))
      .sort((a, b) => parseInt(a.value, 10) - parseInt(b.value, 10));
  }
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

    // Dynamically build categories from metadata entities (country-agnostic)
    // This handles US entities (tax_unit, spm_unit, etc.) and UK entities (benunit) automatically
    const categorized: Record<string, string[]> = {};

    // Initialize categories from available entities in metadata
    if (entities) {
      for (const [entityType, entityInfo] of Object.entries(entities)) {
        // Use 'person' as the key for person entities, otherwise use the entity type
        const key = (entityInfo as any).is_person ? 'person' : entityType;
        categorized[key] = [];
      }
    }

    // Categorize each field by looking up its entity in metadata
    for (const field of inputs) {
      const variable = variables?.[field];
      if (!variable) {
        continue;
      }

      const entityType = variable.entity;
      const entityInfo = entities?.[entityType];

      if (!entityInfo) {
        // Unknown entity - skip field with warning
        console.warn(`[metadataUtils] Unknown entity type "${entityType}" for field "${field}"`);
        continue;
      }

      // Use 'person' as the key for person entities, otherwise use the entity type
      const key = entityInfo.is_person ? 'person' : entityType;

      if (!categorized[key]) {
        categorized[key] = [];
      }
      categorized[key].push(field);
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
): Omit<MetadataState, 'loading' | 'error'> {
  const data = payload.result;
  return {
    currentCountry: country,
    progress: 100, // Transformation happens after successful load
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

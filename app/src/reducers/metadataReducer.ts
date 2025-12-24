import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { buildParameterTree } from "@/libs/buildParameterTree";
import { loadMetadata } from "@/storage";
import {
  MetadataState,
  VariableMetadata,
  ParameterMetadata,
} from "@/types/metadata";

/**
 * Initial state for API-driven metadata
 *
 * Static metadata (entities, basicInputs, timePeriods, regions, modelledPolicies, currentLawId)
 * is no longer stored in Redux. Access it via hooks from @/hooks/useStaticMetadata.
 */
const initialState: MetadataState = {
  currentCountry: null,

  // Unified loading state
  loading: false,
  loaded: false,
  error: null,
  progress: 0,

  // API-driven data
  variables: {},
  parameters: {},
  datasets: [],
  version: null,
  parameterTree: null,
};

// Fetch all metadata (variables, datasets, parameters)
export const fetchMetadataThunk = createAsyncThunk(
  "metadata/fetch",
  async (countryId: string, { rejectWithValue }) => {
    try {
      const result = await loadMetadata(countryId);
      return { ...result, countryId };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  },
);

const metadataSlice = createSlice({
  name: "metadata",
  initialState,
  reducers: {
    setCurrentCountry(state, action: PayloadAction<string>) {
      state.currentCountry = action.payload;
      // Optionally clear existing metadata when country changes
      // This prevents showing stale data from previous country
      if (state.version !== null || state.loaded) {
        // Clear API-driven metadata and reset loading states
        state.variables = {};
        state.parameters = {};
        state.datasets = [];
        state.version = null;
        state.parameterTree = null;
        // Reset loading states
        state.loaded = false;
        state.loading = false;
        state.error = null;
      }
    },
    clearMetadata(state) {
      return { ...initialState, currentCountry: state.currentCountry };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMetadataThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMetadataThunk.fulfilled, (state, action) => {
        const { data, countryId } = action.payload;

        state.loading = false;
        state.loaded = true;
        state.error = null;
        state.currentCountry = countryId;
        state.version = data.version;

        // Transform V2 variables array to record format
        const variablesRecord: Record<string, VariableMetadata> = {};
        for (const v of data.variables) {
          variablesRecord[v.name] = {
            id: v.id,
            name: v.name,
            entity: v.entity,
            description: v.description,
            data_type: v.data_type,
            possible_values: v.possible_values,
            tax_benefit_model_version_id: v.tax_benefit_model_version_id,
            created_at: v.created_at,
            // Generate label from name if not provided
            label: v.name
              .replace(/_/g, " ")
              .replace(/\b\w/g, (c) => c.toUpperCase()),
          };
        }
        state.variables = variablesRecord;

        // Transform V2 datasets
        state.datasets = data.datasets.map((d, i) => ({
          name: d.name,
          label: d.name,
          title: d.description || d.name,
          default: i === 0,
        }));

        // Transform V2 parameters array to record format
        // Note: Parameter values are fetched on-demand, not prefetched
        const parametersRecord: Record<string, ParameterMetadata> = {};
        for (const p of data.parameters) {
          parametersRecord[p.name] = {
            id: p.id,
            name: p.name,
            label: p.label,
            description: p.description,
            unit: p.unit,
            data_type: p.data_type,
            tax_benefit_model_version_id: p.tax_benefit_model_version_id,
            created_at: p.created_at,
            parameter: p.name, // Use name as parameter path
            type: "parameter",
            values: {},
          };
        }

        state.parameters = parametersRecord;

        // Build parameter tree
        try {
          state.parameterTree = buildParameterTree(parametersRecord) || null;
        } catch {
          state.parameterTree = null;
        }

        // Static data (entities, basicInputs, timePeriods, regions, modelledPolicies, currentLawId)
        // is no longer stored in Redux. Access it via hooks from @/hooks/useStaticMetadata.
      })
      .addCase(fetchMetadataThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setCurrentCountry, clearMetadata } = metadataSlice.actions;

export default metadataSlice.reducer;

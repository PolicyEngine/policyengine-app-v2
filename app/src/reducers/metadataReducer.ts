import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { MetadataAdapter } from '@/adapters';
import { fetchDatasets, fetchModelVersion, fetchVariables } from '@/api/v2';
import { setCachedVariables } from '@/libs/metadataCache';
import { MetadataState, VariableMetadata } from '@/types/metadata';

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
};

// Fetch datasets + model version (fast). Variables are loaded separately.
export const fetchMetadataThunk = createAsyncThunk(
  'metadata/fetch',
  async (countryId: string, { rejectWithValue }) => {
    try {
      const [datasets, version] = await Promise.all([
        fetchDatasets(countryId),
        fetchModelVersion(countryId),
      ]);
      return {
        data: { datasets, version },
        countryId,
      };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

// Fetch variables in the background. Writes to Redux + localStorage cache.
export const fetchVariablesThunk = createAsyncThunk(
  'metadata/fetchVariables',
  async (countryId: string, { rejectWithValue }) => {
    try {
      const raw = await fetchVariables(countryId);
      const variables = MetadataAdapter.variablesFromV2(raw);
      setCachedVariables(countryId, variables);
      return { variables, countryId };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

const metadataSlice = createSlice({
  name: 'metadata',
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
        // Reset loading states
        state.loaded = false;
        state.loading = false;
        state.error = null;
      }
    },
    clearMetadata(state) {
      return { ...initialState, currentCountry: state.currentCountry };
    },
    hydrateVariables(
      state,
      action: PayloadAction<{ variables: Record<string, VariableMetadata>; countryId: string }>,
    ) {
      const { variables, countryId } = action.payload;
      if (countryId === state.currentCountry || !state.currentCountry) {
        state.variables = variables;
      }
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

        // Convert V2 API data to frontend format using adapters
        state.datasets = MetadataAdapter.datasetsFromV2(data.datasets);
        // Parameters are no longer bulk-fetched. They are loaded on-demand via
        // useParametersByName (batch endpoint) and useParameterChildren (tree navigation).
        // Variables are loaded separately via fetchVariablesThunk (background, cache-first).
      })
      .addCase(fetchMetadataThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchVariablesThunk.fulfilled, (state, action) => {
        const { variables, countryId } = action.payload;
        if (countryId === state.currentCountry) {
          state.variables = variables;
        }
      });
  },
});

export const { setCurrentCountry, clearMetadata, hydrateVariables } = metadataSlice.actions;

export default metadataSlice.reducer;

import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { MetadataAdapter } from '@/adapters';
import { fetchDatasets, fetchModelVersion, fetchParameters, fetchVariables } from '@/api/v2';
import { buildParameterTreeV2 } from '@/libs/buildParameterTree';
import { MetadataState } from '@/types/metadata';

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

// Fetch all metadata (variables, datasets, parameters) directly from API
export const fetchMetadataThunk = createAsyncThunk(
  'metadata/fetch',
  async (countryId: string, { rejectWithValue }) => {
    try {
      const [variables, datasets, parameters, version] = await Promise.all([
        fetchVariables(countryId),
        fetchDatasets(countryId),
        fetchParameters(countryId),
        fetchModelVersion(countryId),
      ]);
      return {
        data: { variables, datasets, parameters, version },
        countryId,
      };
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

        // Convert V2 API data to frontend format using adapters
        state.variables = MetadataAdapter.variablesFromV2(data.variables);
        state.datasets = MetadataAdapter.datasetsFromV2(data.datasets);
        const parametersRecord = MetadataAdapter.parametersFromV2(data.parameters);
        state.parameters = parametersRecord;

        // Build parameter tree from V2 API data
        try {
          state.parameterTree = buildParameterTreeV2(parametersRecord) || null;
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

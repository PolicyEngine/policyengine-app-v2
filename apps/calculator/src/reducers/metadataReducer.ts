import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
// Import the API function
import { fetchMetadata as fetchMetadataApi } from '@/api/metadata';
import { buildParameterTree } from '@/libs/buildParameterTree';
import { MetadataState } from '@/types/metadata';

const initialState: MetadataState = {
  loading: false,
  error: null,
  currentCountry: null,

  variables: {},
  parameters: {},
  entities: {},
  variableModules: {},
  economyOptions: { region: [], time_period: [], datasets: [] },
  currentLawId: 0,
  basicInputs: [],
  modelledPolicies: { core: {}, filtered: {} },
  version: null,
  parameterTree: null,
};

// Async thunk for fetching metadata
export const fetchMetadataThunk = createAsyncThunk(
  'metadata/fetch',
  async (country: string, { rejectWithValue }) => {
    try {
      // Use the API layer function
      const data = await fetchMetadataApi(country);

      // Return both API data and the country that was fetched
      return { data, country };
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
      if (state.version !== null) {
        // Clear metadata but keep loading/error states
        state.variables = {};
        state.parameters = {};
        state.entities = {};
        state.variableModules = {};
        state.economyOptions = { region: [], time_period: [], datasets: [] };
        state.currentLawId = 0;
        state.basicInputs = [];
        state.modelledPolicies = { core: {}, filtered: {} };
        state.version = null;
        state.parameterTree = null;
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
        const { data, country } = action.payload;
        const body = data.result;

        state.loading = false;
        state.error = null;
        state.currentCountry = country;

        // Transform API response to state
        state.variables = body.variables;
        state.parameters = body.parameters;
        state.entities = body.entities;
        state.variableModules = body.variableModules;
        state.economyOptions = body.economy_options;
        state.currentLawId = body.current_law_id;
        state.basicInputs = body.basicInputs;
        state.modelledPolicies = body.modelled_policies;
        state.version = body.version;

        // Build parameter tree from parameters (following V1 approach)
        try {
          state.parameterTree = buildParameterTree(body.parameters) || null;
        } catch (error) {
          state.parameterTree = null;
        }
      })
      .addCase(fetchMetadataThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setCurrentCountry, clearMetadata } = metadataSlice.actions;

// The metadata.currentCountry state is only used internally by useFetchMetadata
// to track which country's metadata is currently cached.

export default metadataSlice.reducer;

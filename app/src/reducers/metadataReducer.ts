import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
// Import the API function
import { fetchMetadata as fetchMetadataApi } from '@/api/metadata';
import { buildParameterTree } from '@/libs/buildParameterTree';
import { MetadataState } from '@/types/metadata';

const initialState: MetadataState = {
  loading: false,
  error: null,
  currentCountry: null,
  progress: 0,

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
export const fetchMetadataThunk = createAsyncThunk<
  { data: Awaited<ReturnType<typeof fetchMetadataApi>>; country: string },
  string,
  { state: { metadata: MetadataState } }
>(
  'metadata/fetch',
  async (country: string, { rejectWithValue }) => {
    try {
      const data = await fetchMetadataApi(country);
      if (data.status !== 'ok' || !data.result?.version) {
        return rejectWithValue(
          data.message || 'Model information did not include a resolved version'
        );
      }
      return { data, country };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  },
  {
    // Prevent duplicate fetches (e.g. from React StrictMode double-invoking effects)
    condition: (country, { getState }) => {
      const { metadata } = getState();
      if (metadata.loading && metadata.currentCountry === country) {
        return false;
      }
    },
  }
);

const metadataSlice = createSlice({
  name: 'metadata',
  initialState,
  reducers: {
    setCurrentCountry(state, action: PayloadAction<string>) {
      if (state.currentCountry === action.payload) {
        return;
      }

      // Changing country invalidates any pending response as well as cached capabilities.
      return { ...initialState, currentCountry: action.payload };
    },
    clearMetadata(state) {
      return { ...initialState, currentCountry: state.currentCountry };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMetadataThunk.pending, (_state, action) => {
        return {
          ...initialState,
          currentCountry: action.meta.arg,
          currentRequestId: action.meta.requestId,
          loading: true,
        };
      })
      .addCase(fetchMetadataThunk.fulfilled, (state, action) => {
        const { data, country } = action.payload;
        if (
          !state.currentRequestId ||
          state.currentRequestId !== action.meta.requestId ||
          state.currentCountry !== country
        ) {
          return;
        }
        const body = data.result;

        state.loading = false;
        state.error = null;
        state.currentRequestId = undefined;
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
        state.spm = body.spm;

        // Build parameter tree from parameters (following V1 approach)
        try {
          state.parameterTree = buildParameterTree(body.parameters) || null;
        } catch (error) {
          state.parameterTree = null;
        }
      })
      .addCase(fetchMetadataThunk.rejected, (state, action) => {
        if (
          !state.currentRequestId ||
          state.currentRequestId !== action.meta.requestId ||
          state.currentCountry !== action.meta.arg
        ) {
          return;
        }
        state.loading = false;
        state.currentRequestId = undefined;
        state.error = (action.payload as string) || action.error.message || 'Unknown error';
      });
  },
});

export const { setCurrentCountry, clearMetadata } = metadataSlice.actions;

// currentCountry identifies both the active request and the metadata used by readiness checks.

export default metadataSlice.reducer;

import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { buildParameterTree } from '@/libs/buildParameterTree';
import { loadCoreMetadata, loadParameters } from '@/storage';
import { MetadataState } from '@/types/metadata';

const initialState: MetadataState = {
  loading: false,
  error: null,
  currentCountry: null,

  // Tiered loading states
  coreLoading: false,
  coreLoaded: false,
  coreError: null,
  parametersLoading: false,
  parametersLoaded: false,
  parametersError: null,
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

// Async thunk for fetching metadata (V1 - legacy)
export const fetchMetadataThunk = createAsyncThunk<
  { data: Awaited<ReturnType<typeof fetchMetadataApi>>; country: string },
  string
>('metadata/fetch', async (country: string, { rejectWithValue }) => {
  try {
    const data = await fetchMetadataApi(country);
    return { data, country };
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
  }
});

// V2 thunk: Fetch core metadata (variables + datasets)
export const fetchCoreMetadataThunk = createAsyncThunk(
  'metadata/fetchCore',
  async (countryId: string, { rejectWithValue }) => {
    try {
      const result = await loadCoreMetadata(countryId);
      return { ...result, countryId };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

// Fetch parameters (lazy load)
export const fetchParametersThunk = createAsyncThunk(
  'metadata/fetchParameters',
  async (countryId: string, { rejectWithValue }) => {
    try {
      const result = await loadParameters(countryId);
      return result;
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
      if (state.version !== null || state.coreLoaded) {
        // Clear metadata and reset V2 loading states
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
        // Reset V2 states
        state.coreLoaded = false;
        state.coreLoading = false;
        state.coreError = null;
        state.parametersLoaded = false;
        state.parametersLoading = false;
        state.parametersError = null;
      }
    },
    clearMetadata(state) {
      return { ...initialState, currentCountry: state.currentCountry };
    },
  },
  extraReducers: (builder) => {
    builder
      // Core metadata thunk
      .addCase(fetchCoreMetadataThunk.pending, (state) => {
        state.coreLoading = true;
        state.coreError = null;
      })
      .addCase(fetchCoreMetadataThunk.fulfilled, (state, action) => {
        const { data, countryId } = action.payload;

        state.coreLoading = false;
        state.coreLoaded = true;
        state.coreError = null;
        state.currentCountry = countryId;
        state.version = data.version;

        // Transform V2 variables array to record format
        const variablesRecord: Record<string, any> = {};
        for (const v of data.variables) {
          variablesRecord[v.name] = v;
        }
        state.variables = variablesRecord;

        // Transform V2 datasets to economyOptions.datasets format
        state.economyOptions.datasets = data.datasets.map((d, i) => ({
          name: d.name,
          label: d.name,
          title: d.description || d.name,
          default: i === 0,
        }));
      })
      .addCase(fetchCoreMetadataThunk.rejected, (state, action) => {
        state.coreLoading = false;
        state.coreError = action.payload as string;
      })
      // Parameters thunk
      .addCase(fetchParametersThunk.pending, (state) => {
        state.parametersLoading = true;
        state.parametersError = null;
      })
      .addCase(fetchParametersThunk.fulfilled, (state, action) => {
        const { data } = action.payload;

        state.parametersLoading = false;
        state.parametersLoaded = true;
        state.parametersError = null;

        // Transform V2 parameters array to record format with values
        const parametersRecord: Record<string, any> = {};
        for (const p of data.parameters) {
          parametersRecord[p.name] = {
            ...p,
            // Parameter values will be associated by parameter_id
            values: {},
          };
        }

        // Associate parameter values with their parameters
        for (const pv of data.parameterValues) {
          const param = data.parameters.find((p) => p.id === pv.parameter_id);
          if (param && parametersRecord[param.name]) {
            // Use start_date as key for values (V1 format compatibility)
            const dateKey = pv.start_date.split('T')[0];
            parametersRecord[param.name].values[dateKey] = pv.value_json;
          }
        }

        state.parameters = parametersRecord;

        // Build parameter tree
        try {
          state.parameterTree = buildParameterTree(parametersRecord) || null;
        } catch {
          state.parameterTree = null;
        }
      })
      .addCase(fetchParametersThunk.rejected, (state, action) => {
        state.parametersLoading = false;
        state.parametersError = action.payload as string;
      });
  },
});

export const { setCurrentCountry, clearMetadata } = metadataSlice.actions;

export default metadataSlice.reducer;

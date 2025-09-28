import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { parametersAPI } from '@/api/parameters';
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
      // Map country codes to model IDs
      const modelIdMap: Record<string, string> = {
        'us': 'policyengine_us',
        'uk': 'policyengine_uk',
        'ca': 'policyengine_ca',
        'ng': 'policyengine_ng',
        'il': 'policyengine_il',
      };

      const modelId = modelIdMap[country] || `policyengine_${country}`;
      console.log('Fetching parameters for model:', modelId);

      // Just fetch parameters, not baseline values (those will be fetched on demand)
      const allParameters = await parametersAPI.listParameters({ limit: 10000 });

      console.log('All parameters fetched:', allParameters.length);
      console.log('Sample parameter:', allParameters[0]);

      // For now, use all parameters if none match the model_id (for development)
      // Filter parameters by model_id for the current country
      const filteredParameters = allParameters.filter(
        (param: any) => param.model_id === modelId
      );
      console.log('Filtered parameters for', modelId, ':', filteredParameters.length);

      // If no parameters found for this model, use all parameters (for development)
      const parameters = filteredParameters.length > 0 ? filteredParameters : allParameters;
      console.log('Using parameters:', parameters.length);

      // Transform to match expected metadata format (without baseline values for now)
      const parametersData: Record<string, any> = {};

      parameters.forEach((param: any) => {
        const paramPath = param.id; // Use ID as the path

        // Create hierarchical path from parameter name (e.g., "gov.irs.income_tax_rate")
        parametersData[paramPath] = {
          ...param,
          parameter: paramPath,
          label: param.id?.split('.').pop()?.replace(/_/g, ' ') || param.id,
          type: 'parameter',
          economy: true,
          household: true,
          values: {}, // Empty values initially, will be fetched on demand
          unit: param.unit,
          description: param.description,
        };
      });

      // Return in expected format
      return {
        data: {
          result: {
            parameters: parametersData,
            variables: {},
            entities: {},
            variableModules: {},
            economy_options: { region: [], time_period: [], datasets: [] },
            current_law_id: 0,
            basicInputs: [],
            modelled_policies: { core: {}, filtered: {} },
            version: null,
          },
        },
        country,
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
        console.log('SKLOGS Data:');
        console.log(data);

        const body = data.result;
        console.log('SKLOGS Body:');
        console.log(body);

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
          console.log('Parameter tree built successfully:', state.parameterTree);
        } catch (error) {
          console.error('Failed to build parameter tree:', error);
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

// Selectors
export const selectCurrentCountry = (state: { metadata: MetadataState }) =>
  state.metadata.currentCountry;

export default metadataSlice.reducer;

import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
// Import the API functions
import { fetchMetadata as fetchMetadataApi } from '@/api/metadata';
import { fetchV2ModelCatalogMetadata } from '@/api/publicApi/modelCatalog';
import { buildParameterTree } from '@/libs/buildParameterTree';
import { MetadataRoutes, MetadataState } from '@/types/metadata';

/**
 * What to load: a country alone reads `GET /{country}/metadata` (v1), as
 * every caller always has; `{countryId, routes: 'v2'}` reads the small
 * `GET /v2/model-catalog`, and v3 loads the rest on demand.
 */
export type MetadataRequest = string | { countryId: string; routes: MetadataRoutes };

export function metadataRequest(countryId: string, routes: MetadataRoutes): MetadataRequest {
  return routes === 'v1' ? countryId : { countryId, routes };
}

function requestCountry(request: MetadataRequest): string {
  return typeof request === 'string' ? request : request.countryId;
}

function requestRoutes(request: MetadataRequest): MetadataRoutes {
  return typeof request === 'string' ? 'v1' : request.routes;
}

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
  MetadataRequest,
  { state: { metadata: MetadataState } }
>(
  'metadata/fetch',
  async (request: MetadataRequest, { rejectWithValue }) => {
    const country = requestCountry(request);
    try {
      const data =
        requestRoutes(request) === 'v2'
          ? await fetchV2ModelCatalogMetadata(country)
          : await fetchMetadataApi(country);
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
    condition: (request, { getState }) => {
      const { metadata } = getState();
      if (
        metadata.loading &&
        metadata.currentCountry === requestCountry(request) &&
        (metadata.routes ?? 'v1') === requestRoutes(request)
      ) {
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
        const routes = requestRoutes(action.meta.arg);
        return {
          ...initialState,
          currentCountry: requestCountry(action.meta.arg),
          currentRequestId: action.meta.requestId,
          loading: true,
          ...(routes === 'v1' ? {} : { routes }),
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

        if (requestRoutes(action.meta.arg) === 'v2') {
          // Parameters arrive on demand, so there is no whole tree to build:
          // v3 reads the tree one level at a time from the v2 routes.
          state.routes = 'v2';
          state.v2Catalog = body.v2Catalog ?? null;
          state.parameterTree = null;
          return;
        }

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
          state.currentCountry !== requestCountry(action.meta.arg)
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

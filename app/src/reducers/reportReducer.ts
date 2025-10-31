import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { countryIds, DEFAULT_COUNTRY } from '@/libs/countries';
import { RootState } from '@/store';
import { Report, ReportOutput } from '@/types/ingredients/Report';

// Local report state - countryId synced from URL via metadata state
interface ReportState extends Report {
  activeSimulationPosition: 0 | 1;
  mode: 'standalone' | 'report';
  createdAt: string; // Local state tracking
  updatedAt: string; // Local state tracking
}

const initialState: ReportState = {
  id: '',
  label: null,
  countryId: DEFAULT_COUNTRY, // Fallback until clearReport thunk sets actual country from URL
  simulationIds: [],
  apiVersion: null,
  status: 'pending',
  output: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  activeSimulationPosition: 0,
  mode: 'standalone',
};

/**
 * Thunk to clear report and initialize with country from URL
 * Accepts countryId directly from route parameters to avoid race conditions
 * with metadata state synchronization
 */
export const clearReport = createAsyncThunk<
  (typeof countryIds)[number],
  (typeof countryIds)[number], // Accept countryId as parameter
  { state: RootState }
>('report/clearReport', async (countryId) => {
  return countryId;
});

export const reportSlice = createSlice({
  name: 'report',
  initialState,
  reducers: {
    // Add a simulation ID to the report
    addSimulationId: (state, action: PayloadAction<string>) => {
      if (!state.simulationIds.includes(action.payload)) {
        state.simulationIds.push(action.payload);
        state.updatedAt = new Date().toISOString();
      }
    },

    // Remove a simulation ID from the report
    removeSimulationId: (state, action: PayloadAction<string>) => {
      state.simulationIds = state.simulationIds.filter((id) => id !== action.payload);
      state.updatedAt = new Date().toISOString();
    },

    // Update API version
    updateApiVersion: (state, action: PayloadAction<string | null>) => {
      state.apiVersion = action.payload;
    },

    // Update country ID (rarely used - clearReport thunk handles initialization)
    updateCountryId: (state, action: PayloadAction<typeof initialState.countryId>) => {
      state.countryId = action.payload;
    },

    // Update report label
    updateLabel: (state, action: PayloadAction<string | null>) => {
      state.label = action.payload;
      state.updatedAt = new Date().toISOString();
    },

    // Update report ID
    updateReportId: (state, action: PayloadAction<string>) => {
      state.id = action.payload;
      state.updatedAt = new Date().toISOString();
    },

    // Update report status
    updateReportStatus: (state, action: PayloadAction<'pending' | 'complete' | 'error'>) => {
      state.status = action.payload;
      state.updatedAt = new Date().toISOString();
    },

    // Update report output
    updateReportOutput: (state, action: PayloadAction<ReportOutput | null>) => {
      state.output = action.payload as any; // Can be economy or household output
      state.updatedAt = new Date().toISOString();
    },

    // Mark report as complete (sets status to complete)
    markReportAsComplete: (state) => {
      state.status = 'complete';
      state.updatedAt = new Date().toISOString();
    },

    markReportAsError: (state) => {
      state.status = 'error';
      state.updatedAt = new Date().toISOString();
    },

    // Update timestamps
    updateTimestamps: (
      state,
      action: PayloadAction<{ createdAt?: string; updatedAt?: string }>
    ) => {
      if (action.payload.createdAt) {
        state.createdAt = action.payload.createdAt;
      }
      if (action.payload.updatedAt) {
        state.updatedAt = action.payload.updatedAt;
      }
    },

    // Set the active simulation position (0 or 1)
    setActiveSimulationPosition: (state, action: PayloadAction<0 | 1>) => {
      state.activeSimulationPosition = action.payload;
      state.updatedAt = new Date().toISOString();
    },

    // Set the mode (standalone or report)
    setMode: (state, action: PayloadAction<'standalone' | 'report'>) => {
      state.mode = action.payload;
      if (action.payload === 'standalone') {
        state.activeSimulationPosition = 0;
      }
      state.updatedAt = new Date().toISOString();
    },

    // Initialize report for creation - sets up initial state for report creation flow
    initializeReport: (state) => {
      // Clear any existing report data
      state.id = '';
      state.label = null;
      state.simulationIds = [];
      state.status = 'pending';
      state.output = null;

      // Set up for report mode
      state.mode = 'report';
      state.activeSimulationPosition = 0;

      // Update timestamps
      const now = new Date().toISOString();
      state.createdAt = now;
      state.updatedAt = now;

      // Preserve countryId and apiVersion
    },
  },
  extraReducers: (builder) => {
    builder.addCase(clearReport.fulfilled, (state, action) => {
      // Clear all report data
      state.id = '';
      state.label = null;
      state.simulationIds = [];
      state.status = 'pending';
      state.output = null;
      state.createdAt = new Date().toISOString();
      state.updatedAt = new Date().toISOString();
      // Reset to initial position and mode
      state.activeSimulationPosition = 0;
      state.mode = 'standalone';
      // Set country from metadata (payload from thunk)
      state.countryId = action.payload;
      // Preserve apiVersion
    });
  },
});

// Action creators are generated for each case reducer function
export const {
  addSimulationId,
  removeSimulationId,
  updateApiVersion,
  updateCountryId,
  updateLabel,
  updateReportId,
  updateReportStatus,
  updateReportOutput,
  markReportAsComplete,
  markReportAsError,
  updateTimestamps,
  setActiveSimulationPosition,
  setMode,
  initializeReport,
} = reportSlice.actions;

// Selectors
export const selectActiveSimulationPosition = (state: RootState): 0 | 1 =>
  state.report.activeSimulationPosition;

export const selectMode = (state: RootState): 'standalone' | 'report' => state.report.mode;

export default reportSlice.reducer;

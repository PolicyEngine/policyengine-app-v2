import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Report, ReportOutput } from '@/types/ingredients/Report';

const initialState: Report = {
  reportId: '',
  simulationIds: [],
  status: 'pending',
  output: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

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

    // Clear the report
    clearReport: (state) => {
      state.reportId = '';
      state.simulationIds = [];
      state.status = 'pending';
      state.output = null;
      state.createdAt = new Date().toISOString();
      state.updatedAt = new Date().toISOString();
    },

    // Update report ID
    updateReportId: (state, action: PayloadAction<string>) => {
      state.reportId = action.payload;
      state.updatedAt = new Date().toISOString();
    },

    // Update report status
    updateReportStatus: (state, action: PayloadAction<'pending' | 'complete' | 'error'>) => {
      state.status = action.payload;
      state.updatedAt = new Date().toISOString();
    },

    // Update report output
    updateReportOutput: (state, action: PayloadAction<ReportOutput | null>) => {
      state.output = action.payload;
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
  },
});

// Action creators are generated for each case reducer function
export const {
  addSimulationId,
  removeSimulationId,
  clearReport,
  updateReportId,
  updateReportStatus,
  updateReportOutput,
  markReportAsComplete,
  markReportAsError,
  updateTimestamps,
} = reportSlice.actions;

export default reportSlice.reducer;

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Simulation } from '@/types/ingredients/Simulation';

const initialState: Simulation = {
  populationId: undefined,
  policyId: undefined,
  populationType: undefined,
  label: null,
  id: undefined,
  isCreated: false,
};

export const simulationSlice = createSlice({
  name: 'simulation',
  initialState,
  reducers: {
    updateSimulationPopulationId: (
      state,
      action: PayloadAction<{ id: string; type: 'household' | 'geography' }>
    ) => {
      state.populationId = action.payload.id;
      state.populationType = action.payload.type;
    },
    updateSimulationPolicyId: (state, action: PayloadAction<string>) => {
      state.policyId = action.payload;
    },
    updateSimulationLabel: (state, action: PayloadAction<string>) => {
      state.label = action.payload;
    },
    updateSimulationId: (state, action: PayloadAction<string>) => {
      state.id = action.payload;
    },
    markSimulationAsCreated: (state) => {
      state.isCreated = true;
    },
    clearSimulation: (state) => {
      state.populationId = undefined;
      state.policyId = undefined;
      state.populationType = undefined;
      state.label = null;
      state.id = undefined;
      state.isCreated = false;
    },
  },
});

export const {
  updateSimulationPopulationId,
  updateSimulationPolicyId,
  updateSimulationLabel,
  updateSimulationId,
  markSimulationAsCreated,
  clearSimulation,
} = simulationSlice.actions;

export default simulationSlice.reducer;

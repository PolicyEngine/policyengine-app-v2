import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// SimulationState represents the mutable state for building a simulation
interface SimulationState {
  populationId: string;
  policyId: string;
  label: string | null;
  id: string | undefined;
  isCreated: boolean;
}

const initialState: SimulationState = {
  populationId: '',
  policyId: '',
  label: null,
  id: undefined,
  isCreated: false,
};

export const simulationSlice = createSlice({
  name: 'simulation',
  initialState,
  reducers: {
    updateSimulationPopulationId: (state, action: PayloadAction<string>) => {
      state.populationId = action.payload;
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
      state.populationId = '';
      state.policyId = '';
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
  clearSimulation 
} = simulationSlice.actions;

export default simulationSlice.reducer;

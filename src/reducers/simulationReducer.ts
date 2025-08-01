import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Simulation } from '@/types/simulation';

const initialState: Simulation = {
  populationId: '',
  policyId: '',
};

export const simulationSlice = createSlice({
  name: 'simulation',
  initialState,
  reducers: {
    updatePopulationId: (state, action: PayloadAction<string>) => {
      state.populationId = action.payload;
    },
    updatePolicyId: (state, action: PayloadAction<string>) => {
      state.policyId = action.payload;
    },
    clearSimulation: (state) => {
      state.populationId = '';
      state.policyId = '';
    },
  },
});

export const { updatePopulationId, updatePolicyId, clearSimulation } =
  simulationSlice.actions;

export default simulationSlice.reducer;

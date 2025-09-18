import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Simulation } from '@/types/ingredients/Simulation';

// Position-based storage for exactly 2 simulations
interface SimulationsState {
  simulations: [Simulation | null, Simulation | null];  // Store directly by position
}

const initialState: SimulationsState = {
  simulations: [null, null],
};

export const simulationsSlice = createSlice({
  name: 'simulations',
  initialState,
  reducers: {

    // Create/replace at position
    createSimulationAtPosition: (
      state,
      action: PayloadAction<{
        position: 0 | 1;
        simulation?: Partial<Simulation>;
      }>
    ) => {
      const newSimulation: Simulation = {
        id: undefined, // No ID until API creates it
        populationId: undefined,
        policyId: undefined,
        populationType: undefined,
        label: null,
        isCreated: false,
        ...action.payload.simulation,
      };
      state.simulations[action.payload.position] = newSimulation;
    },

    // Update fields at position
    updateSimulationAtPosition: (
      state,
      action: PayloadAction<{
        position: 0 | 1;
        updates: Partial<Simulation>;
      }>
    ) => {
      const sim = state.simulations[action.payload.position];
      if (!sim) {
        throw new Error(`Cannot update simulation at position ${action.payload.position}: no simulation exists at that position`);
      }
      state.simulations[action.payload.position] = {
        ...sim,
        ...action.payload.updates
      };
    },


    // Clear position
    clearSimulationAtPosition: (state, action: PayloadAction<0 | 1>) => {
      state.simulations[action.payload] = null;
    },

    // Swap positions
    swapSimulations: (state) => {
      [state.simulations[0], state.simulations[1]] =
      [state.simulations[1], state.simulations[0]];
    },

    // Clear all
    clearAllSimulations: (state) => {
      state.simulations = [null, null];
    },
  },
});

export const {
  createSimulationAtPosition,
  updateSimulationAtPosition,
  clearSimulationAtPosition,
  swapSimulations,
  clearAllSimulations,
} = simulationsSlice.actions;

// Selectors
export const selectSimulationAtPosition = (
  state: { simulations: SimulationsState },
  position: 0 | 1
): Simulation | null => {
  return state.simulations?.simulations[position] || null;
};

export const selectBothSimulations = (
  state: { simulations: SimulationsState }
): [Simulation | null, Simulation | null] => {
  return state.simulations?.simulations || [null, null];
};

export const selectHasEmptySlot = (state: { simulations: SimulationsState }): boolean => {
  const [sim1, sim2] = selectBothSimulations(state);
  return sim1 === null || sim2 === null;
};

export const selectIsSlotEmpty = (
  state: { simulations: SimulationsState },
  position: 0 | 1
): boolean => {
  return selectSimulationAtPosition(state, position) === null;
};

export const selectSimulationById = (
  state: { simulations: SimulationsState },
  id: string | undefined
): Simulation | null => {
  if (!id) return null;
  const [sim1, sim2] = selectBothSimulations(state);
  if (sim1?.id === id) return sim1;
  if (sim2?.id === id) return sim2;
  return null;
};

export const selectAllSimulations = (
  state: { simulations: SimulationsState }
): Simulation[] => {
  const [sim1, sim2] = selectBothSimulations(state);
  const simulations: Simulation[] = [];
  if (sim1) simulations.push(sim1);
  if (sim2) simulations.push(sim2);
  return simulations;
};

export default simulationsSlice.reducer;

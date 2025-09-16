import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Simulation } from '@/types/ingredients/Simulation';

// Position-based storage for exactly 2 simulations
interface SimulationsState {
  simulations: [Simulation | null, Simulation | null];  // Store directly by position
  activePosition: 0 | 1 | null;                        // Which position is active
}

const initialState: SimulationsState = {
  simulations: [null, null],
  activePosition: null,
};

export const simulationsSlice = createSlice({
  name: 'simulations',
  initialState,
  reducers: {
    // Create simulation at first available position
    createSimulation: (state, action: PayloadAction<Partial<Simulation> | undefined>) => {
      const emptyIndex = findFirstEmpty(state.ids);

      if (emptyIndex === -1) {
        throw new Error('Both simulation slots are occupied. Clear one before creating a new simulation.');
      }

      const id = generateTempId();
      const newSimulation: Simulation = {
        populationId: undefined,
        policyId: undefined,
        populationType: undefined,
        label: null,
        id: undefined,
        isCreated: false,
        ...action.payload,
      };

      state.entities[id] = newSimulation;
      state.ids = setAt(state.ids, emptyIndex, id);
      state.activeId = id;
    },

    // Create/replace simulation at specific position (0 or 1)
    createSimulationAtPosition: (
      state,
      action: PayloadAction<{ position: 0 | 1; simulation?: Partial<Simulation> }>
    ) => {
      const { position, simulation } = action.payload;

      // Enforce that position must be 0 or 1
      if (position !== 0 && position !== 1) {
        throw new Error('Position must be 0 or 1 for report simulations');
      }

      // Clear existing simulation at this position if present
      const existingId = get(state.ids, position);
      if (existingId) {
        delete state.entities[existingId];
      }

      const id = generateTempId();
      const newSimulation: Simulation = {
        populationId: undefined,
        policyId: undefined,
        populationType: undefined,
        label: null,
        id: undefined,
        isCreated: false,
        ...simulation,
      };

      state.entities[id] = newSimulation;
      state.ids = setAt(state.ids, position, id);
      state.activeId = id;
    },

    // Update a specific simulation's field (mirrors original reducer actions)
    updateSimulationPopulationId: (
      state,
      action: PayloadAction<{
        simulationId?: string;
        populationId: string;
        populationType: 'household' | 'geography';
      }>
    ) => {
      const id = action.payload.simulationId || state.activeId;
      if (id && state.entities[id]) {
        state.entities[id].populationId = action.payload.populationId;
        state.entities[id].populationType = action.payload.populationType;
      }
    },

    updateSimulationPolicyId: (
      state,
      action: PayloadAction<{ simulationId?: string; policyId: string }>
    ) => {
      const id = action.payload.simulationId || state.activeId;
      if (id && state.entities[id]) {
        state.entities[id].policyId = action.payload.policyId;
      }
    },

    updateSimulationLabel: (
      state,
      action: PayloadAction<{ simulationId?: string; label: string }>
    ) => {
      const id = action.payload.simulationId || state.activeId;
      if (id && state.entities[id]) {
        state.entities[id].label = action.payload.label;
      }
    },

    updateSimulationId: (state, action: PayloadAction<{ simulationId?: string; id: string }>) => {
      const simId = action.payload.simulationId || state.activeId;
      if (simId && state.entities[simId]) {
        state.entities[simId].id = action.payload.id;
      }
    },

    markSimulationAsCreated: (state, action: PayloadAction<{ simulationId?: string }>) => {
      const id = action.payload?.simulationId || state.activeId;
      if (id && state.entities[id]) {
        state.entities[id].isCreated = true;
      }
    },

    // Generic field updater for flexibility
    updateSimulationField: (
      state,
      action: PayloadAction<{
        simulationId?: string;
        field: keyof Simulation;
        value: any;
      }>
    ) => {
      const id = action.payload.simulationId || state.activeId;
      if (id && state.entities[id]) {
        (state.entities[id] as any)[action.payload.field] = action.payload.value;
      }
    },

    // Set which simulation is currently being edited
    setActiveSimulation: (state, action: PayloadAction<string>) => {
      if (state.ids.includes(action.payload)) {
        state.activeId = action.payload;
      }
    },

    // Remove simulation but preserve position (sets to null)
    removeSimulation: (state, action: PayloadAction<string>) => {
      const index = findIndex(state.ids, id => id === action.payload);

      if (index !== -1) {
        state.ids = removeAt(state.ids, index);
        delete state.entities[action.payload];

        if (state.activeId === action.payload) {
          // Find next non-null simulation
          const nextId = getCompactArray(state.ids).find(id => id !== action.payload) || null;
          state.activeId = nextId;
        }
      }
    },

    // Clear specific position (0 or 1)
    clearSimulationAtPosition: (state, action: PayloadAction<0 | 1>) => {
      const id = get(state.ids, action.payload);

      if (id) {
        delete state.entities[id];
        state.ids = removeAt(state.ids, action.payload);

        if (state.activeId === id) {
          const nextId = getCompactArray(state.ids).find(otherId => otherId !== id) || null;
          state.activeId = nextId;
        }
      }
    },

    // Swap the two positions
    swapSimulations: (state) => {
      state.ids = swap(state.ids, 0, 1);
    },

    // Set active by position (0 or 1)
    setActiveSimulationByPosition: (state, action: PayloadAction<0 | 1>) => {
      const id = get(state.ids, action.payload);
      if (id) {
        state.activeId = id;
      }
    },

    // Clear a specific simulation (reset to initial values)
    clearSimulation: (state, action: PayloadAction<{ simulationId?: string }>) => {
      const id = action.payload?.simulationId || state.activeId;
      if (id && state.entities[id]) {
        state.entities[id] = {
          populationId: undefined,
          policyId: undefined,
          populationType: undefined,
          label: null,
          id: undefined,
          isCreated: false,
        };
      }
    },

    // Clear all simulations
    clearAllSimulations: (state) => {
      state.entities = {};
      state.ids = FixedLengthSet(2);  // Reset to size 2
      state.activeId = null;
    },

    // Update fields by position
    updateSimulationFieldByPosition: (
      state,
      action: PayloadAction<{
        position: 0 | 1;
        field: keyof Simulation;
        value: any;
      }>
    ) => {
      const id = get(state.ids, action.payload.position);
      if (id && state.entities[id]) {
        (state.entities[id] as any)[action.payload.field] = action.payload.value;
      }
    },

    // Replace temp ID with permanent ID after API creation
    replaceSimulationId: (
      state,
      action: PayloadAction<{ tempId: string; permanentId: string }>
    ) => {
      const { tempId, permanentId } = action.payload;
      const index = findIndex(state.ids, id => id === tempId);

      if (index !== -1 && state.entities[tempId]) {
        // Update the entity
        state.entities[permanentId] = state.entities[tempId];
        state.entities[permanentId].id = permanentId;
        delete state.entities[tempId];

        // Update the ids array
        state.ids = setAt(state.ids, index, permanentId);

        // Update activeId if needed
        if (state.activeId === tempId) {
          state.activeId = permanentId;
        }
      }
    },
  },
});

export const {
  createSimulation,
  createSimulationAtPosition,
  updateSimulationPopulationId,
  updateSimulationPolicyId,
  updateSimulationLabel,
  updateSimulationId,
  markSimulationAsCreated,
  updateSimulationField,
  updateSimulationFieldByPosition,
  setActiveSimulation,
  setActiveSimulationByPosition,
  removeSimulation,
  clearSimulation,
  clearSimulationAtPosition,
  clearAllSimulations,
  swapSimulations,
  replaceSimulationId,
} = simulationsSlice.actions;

// Selectors
export const selectSimulationById = (
  state: { simulations: SimulationsState },
  id: string
): Simulation | undefined => state.simulations?.entities[id];

export const selectActiveSimulationId = (state: { simulations: SimulationsState }): string | null =>
  state.simulations?.activeId || null;

export const selectActiveSimulation = (state: {
  simulations: SimulationsState;
}): Simulation | undefined => {
  const activeId = selectActiveSimulationId(state);
  return activeId ? state.simulations.entities[activeId] : undefined;
};

export const selectAllSimulations = (state: { simulations: SimulationsState }): Simulation[] =>
  getCompactArray(state.simulations?.ids || [])
    .map(id => state.simulations.entities[id])
    .filter(Boolean);

export const selectSimulationAtPosition = (
  state: { simulations: SimulationsState },
  position: 0 | 1
): Simulation | null => {
  const id = get(state.simulations.ids, position);
  return id ? state.simulations.entities[id] : null;
};

export const selectBothSimulations = (
  state: { simulations: SimulationsState }
): [Simulation | null, Simulation | null] => {
  return [
    selectSimulationAtPosition(state, 0),
    selectSimulationAtPosition(state, 1)
  ];
};

export const selectHasEmptySlot = (state: { simulations: SimulationsState }): boolean => {
  return state.simulations.ids.includes(null);
};

export const selectIsSlotEmpty = (
  state: { simulations: SimulationsState },
  position: 0 | 1
): boolean => {
  return get(state.simulations.ids, position) === null;
};

export default simulationsSlice.reducer;

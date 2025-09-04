import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Simulation } from '@/types/ingredients/Simulation';

interface SimulationsState {
  entities: Record<string, Simulation>;
  ids: string[];
  activeId: string | null;
  mode: 'single' | 'multi';
}

const initialState: SimulationsState = {
  entities: {},
  ids: [],
  activeId: null,
  mode: 'single', // Start in single mode for backward compatibility
};

// Helper to generate temporary IDs for unsaved simulations
let tempIdCounter = 1;
const generateTempId = () => `temp-${tempIdCounter++}`;

export const simulationsSlice = createSlice({
  name: 'simulations',
  initialState,
  reducers: {
    // @compat Mode control: "single" allows storage of only one simulation for backward compatibility reasons;
    // will be removed when simulationReducer is replaced
    setSimulationsMode: (state, action: PayloadAction<'single' | 'multi'>) => {
      state.mode = action.payload;
    },

    // Create a new simulation and set it as active
    createSimulation: (state, action: PayloadAction<Partial<Simulation> | undefined>) => {
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
      state.ids.push(id);
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

    updateSimulationId: (
      state,
      action: PayloadAction<{ simulationId?: string; id: string }>
    ) => {
      const simId = action.payload.simulationId || state.activeId;
      if (simId && state.entities[simId]) {
        state.entities[simId].id = action.payload.id;
      }
    },

    markSimulationAsCreated: (
      state,
      action: PayloadAction<{ simulationId?: string }>
    ) => {
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

    // Remove a simulation
    removeSimulation: (state, action: PayloadAction<string>) => {
      delete state.entities[action.payload];
      state.ids = state.ids.filter(id => id !== action.payload);
      
      // If we removed the active simulation, set a new active one
      if (state.activeId === action.payload) {
        state.activeId = state.ids.length > 0 ? state.ids[0] : null;
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
      state.ids = [];
      state.activeId = null;
    },

    // Replace temp ID with permanent ID after API creation
    replaceSimulationId: (
      state,
      action: PayloadAction<{ tempId: string; permanentId: string }>
    ) => {
      const { tempId, permanentId } = action.payload;
      if (state.entities[tempId]) {
        // Update the entity
        state.entities[permanentId] = state.entities[tempId];
        state.entities[permanentId].id = permanentId;
        delete state.entities[tempId];
        
        // Update the ids array
        const index = state.ids.indexOf(tempId);
        if (index !== -1) {
          state.ids[index] = permanentId;
        }
        
        // Update activeId if needed
        if (state.activeId === tempId) {
          state.activeId = permanentId;
        }
      }
    },
  },
});

export const {
  setSimulationsMode,
  createSimulation,
  updateSimulationPopulationId,
  updateSimulationPolicyId,
  updateSimulationLabel,
  updateSimulationId,
  markSimulationAsCreated,
  updateSimulationField,
  setActiveSimulation,
  removeSimulation,
  clearSimulation,
  clearAllSimulations,
  replaceSimulationId,
} = simulationsSlice.actions;

// Selectors
export const selectSimulationById = (state: { simulations: SimulationsState }, id: string): Simulation | undefined =>
  state.simulations?.entities[id];

export const selectActiveSimulationId = (state: { simulations: SimulationsState }): string | null =>
  state.simulations?.activeId || null;

export const selectActiveSimulation = (state: { simulations: SimulationsState }): Simulation | undefined => {
  const activeId = selectActiveSimulationId(state);
  return activeId ? state.simulations.entities[activeId] : undefined;
};

export const selectAllSimulations = (state: { simulations: SimulationsState }): Simulation[] =>
  state.simulations?.ids.map((id: string) => state.simulations.entities[id]) || [];

// @compat Selector for simulation mode
export const selectSimulationsMode = (state: { simulations: SimulationsState }): 'single' | 'multi' =>
  state.simulations?.mode || 'single';

// @compat Compatibility selector - bridges between old and new state structure
export const selectSimulationCompat = (state: { simulations?: SimulationsState; simulation?: Simulation }): Simulation | undefined => {
  // If in single mode and we have an active simulation in the new structure, use it
  console.log('Active simulation ID: ', state.simulations?.activeId);
  console.log('Multi mode: ', state.simulations);
  console.log('Old simulation state: ', state.simulation);
  if (state.simulations?.mode === 'multi' && state.simulations?.activeId) {
    return selectActiveSimulation(state as { simulations: SimulationsState });
  }
  
  // Otherwise fall back to the old simulation state if it exists
  // This allows gradual migration
  return state.simulation || selectActiveSimulation(state as { simulations: SimulationsState });
};

export default simulationsSlice.reducer;
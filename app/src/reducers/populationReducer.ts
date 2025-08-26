// src/reducers/populationReducer.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Household } from '@/types/ingredients/Household';
import { HouseholdBuilder } from '@/utils/HouseholdBuilder';

// Population state that wraps Household with metadata
interface PopulationState {
  id: string | undefined;
  label: string | null;
  isCreated: boolean;
  household: Household | null;

  // Geographic info for non-household populations
  geographicScope: 'national' | 'state' | '';
  region: string;
  geographicAssociationId: string | undefined;
}

const initialState: PopulationState = {
  id: undefined,
  label: null,
  isCreated: false,
  household: null,
  geographicScope: '',
  region: '',
  geographicAssociationId: undefined,
};

export const populationSlice = createSlice({
  name: 'population',
  initialState,
  reducers: {
    clearPopulation: (state) => {
      state.id = undefined;
      state.label = null;
      state.isCreated = false;
      state.household = null;
      state.geographicScope = '';
      state.region = '';
      state.geographicAssociationId = undefined;
    },

    updatePopulationId: (state, action: PayloadAction<string>) => {
      state.id = action.payload;
    },

    updatePopulationLabel: (state, action: PayloadAction<string>) => {
      state.label = action.payload;
    },

    markPopulationAsCreated: (state) => {
      state.isCreated = true;
    },

    // Set the entire household
    setHousehold: (state, action: PayloadAction<Household>) => {
      state.household = action.payload;
    },

    // Initialize a new household
    initializeHousehold: (state, action: PayloadAction<{ countryId: string; year?: string }>) => {
      const { countryId, year = '2024' } = action.payload;
      const builder = new HouseholdBuilder(countryId as any, year);
      state.household = builder.build();
    },

    // Geographic scope actions
    setGeographicScope: (state, action: PayloadAction<PopulationState['geographicScope']>) => {
      state.geographicScope = action.payload;
    },

    setRegion: (state, action: PayloadAction<string>) => {
      state.region = action.payload;
    },

    updateGeographicAssociationId: (state, action: PayloadAction<string>) => {
      state.geographicAssociationId = action.payload;
    },

    // Generic updater for backward compatibility
    updatePopulation: (state, action: PayloadAction<Partial<PopulationState>>) => {
      Object.assign(state, action.payload);
    },
  },
});

export const {
  clearPopulation,
  updatePopulationId,
  updatePopulationLabel,
  markPopulationAsCreated,
  setHousehold,
  initializeHousehold,
  setGeographicScope,
  setRegion,
  updateGeographicAssociationId,
  updatePopulation,
} = populationSlice.actions;

export default populationSlice.reducer;

// Export types for use in components
export type { PopulationState };

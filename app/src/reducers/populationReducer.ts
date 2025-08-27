// src/reducers/populationReducer.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Geography } from '@/types/ingredients/Geography';
import { Household } from '@/types/ingredients/Household';
import { Population } from '@/types/ingredients/Population';
import { HouseholdBuilder } from '@/utils/HouseholdBuilder';

const initialState: Population = {
  label: null,
  isCreated: false,
  household: null,
  geography: null,
};

export const populationSlice = createSlice({
  name: 'population',
  initialState,
  reducers: {
    clearPopulation: (state) => {
      state.label = null;
      state.isCreated = false;
      state.household = null;
      state.geography = null;
    },

    updatePopulationId: (state, action: PayloadAction<string>) => {
      // Update ID in the appropriate population type
      if (state.household) {
        state.household.id = action.payload;
      } else if (state.geography) {
        state.geography.id = action.payload;
      }
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
      state.geography = null; // Clear geography when setting household
    },

    // Initialize a new household
    initializeHousehold: (state, action: PayloadAction<{ countryId: string; year?: string }>) => {
      const { countryId, year = '2024' } = action.payload;
      const builder = new HouseholdBuilder(countryId as any, year);
      state.household = builder.build();
    },

    // Set geography
    setGeography: (state, action: PayloadAction<Geography>) => {
      state.geography = action.payload;
      state.household = null; // Clear household when setting geography
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
  setGeography,
} = populationSlice.actions;

export default populationSlice.reducer;

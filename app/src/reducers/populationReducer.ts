// src/reducers/populationReducer.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface PersonInfo {
  age: string;
  employment_income: string;
}

export interface HouseholdInfo {
  [key: string]: string; // Dynamic fields based on basicInputs
}

// Updated Population type to support dynamic structure
interface Population {
  id: string | undefined;
  label: string | undefined;
  isCreated: boolean;

  // Core household info
  taxYear: string;
  maritalStatus: 'single' | 'married';
  numChildren: number;

  // Dynamic household-level fields (state_name, brma, region, etc.)
  householdInfo: HouseholdInfo;

  // Person-level data
  adults: {
    primary: PersonInfo;
    spouse?: PersonInfo; // Only exists if married
  };
  children: PersonInfo[];

  // Geographic info (existing fields for backward compatibility)
  geographicScope: 'national' | 'state' | 'household' | '';
  region: string;
  geographicAssociationId: string | undefined;
}

const initialState: Population = {
  id: undefined,
  label: undefined,
  isCreated: false,
  taxYear: '',
  maritalStatus: 'single',
  numChildren: 0,
  householdInfo: {},
  adults: {
    primary: { age: '', employment_income: '' },
  },
  children: [],
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
      state.label = undefined;
      state.isCreated = false;
      state.taxYear = '';
      state.maritalStatus = 'single';
      state.numChildren = 0;
      state.householdInfo = {};
      state.adults = {
        primary: { age: '', employment_income: '' },
      };
      state.children = [];
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

    updateTaxYear: (state, action: PayloadAction<string>) => {
      state.taxYear = action.payload;
    },

    updateMaritalStatus: (state, action: PayloadAction<'single' | 'married'>) => {
      state.maritalStatus = action.payload;

      // Add or remove spouse based on marital status
      if (action.payload === 'married') {
        if (!state.adults.spouse) {
          state.adults.spouse = { age: '', employment_income: '' };
        }
      } else {
        delete state.adults.spouse;
      }
    },

    updateNumChildren: (state, action: PayloadAction<number>) => {
      const newCount = action.payload;
      state.numChildren = newCount;

      // Resize children array
      if (newCount > state.children.length) {
        // Add new children
        const toAdd = newCount - state.children.length;
        for (let i = 0; i < toAdd; i++) {
          state.children.push({ age: '', employment_income: '' });
        }
      } else if (newCount < state.children.length) {
        // Remove excess children
        state.children = state.children.slice(0, newCount);
      }
    },

    updateHouseholdInfo: (state, action: PayloadAction<{ field: string; value: string }>) => {
      const { field, value } = action.payload;
      state.householdInfo[field] = value;
    },

    updateAdultInfo: (
      state,
      action: PayloadAction<{
        person: 'primary' | 'spouse';
        field: 'age' | 'employment_income';
        value: string;
      }>
    ) => {
      const { person, field, value } = action.payload;
      if (person === 'primary') {
        state.adults.primary[field] = value;
      } else if (person === 'spouse' && state.adults.spouse) {
        state.adults.spouse[field] = value;
      }
    },

    updateChildInfo: (
      state,
      action: PayloadAction<{
        index: number;
        field: 'age' | 'employment_income';
        value: string;
      }>
    ) => {
      const { index, field, value } = action.payload;
      if (index >= 0 && index < state.children.length) {
        state.children[index][field] = value;
      }
    },

    // Legacy actions for backward compatibility
    setGeographicScope: (state, action: PayloadAction<Population['geographicScope']>) => {
      state.geographicScope = action.payload;
    },

    setRegion: (state, action: PayloadAction<string>) => {
      state.region = action.payload;
    },

    updateGeographicAssociationId: (state, action: PayloadAction<string>) => {
      state.geographicAssociationId = action.payload;
    },

    // Generic updater for any field (legacy support)
    updatePopulation: (state, action: PayloadAction<Partial<Population>>) => {
      Object.assign(state, action.payload);
    },
  },
});

export const {
  clearPopulation,
  updatePopulationId,
  updatePopulationLabel,
  markPopulationAsCreated,
  updateTaxYear,
  updateMaritalStatus,
  updateNumChildren,
  updateHouseholdInfo,
  updateAdultInfo,
  updateChildInfo,
  setGeographicScope,
  setRegion,
  updateGeographicAssociationId,
  updatePopulation,
} = populationSlice.actions;

export default populationSlice.reducer;

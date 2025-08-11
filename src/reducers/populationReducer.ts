// src/reducers/populationReducer.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Household } from '@/types/household';

export interface ChildInfo {
  age: string;
  income: string;
}

// Extend Population type locally to include UI-specific fields
interface Population extends Household {
  id: string | undefined;
  label: string | undefined;
  isCreated: boolean;
  geographicScope: 'national' | 'state' | 'household' | '';
  region: string; //holds name value of selected region/state
}

const initialState: Population = {
  id: undefined,
  label: undefined,
  isCreated: false,
  taxYear: '',
  maritalStatus: 'single',
  numChildren: 0,
  children: [],
  geographicScope: '',
  region: '',
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
      state.children = [];
      state.geographicScope = '';
      state.region = '';
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
    setGeographicScope: (state, action: PayloadAction<Population['geographicScope']>) => {
      state.geographicScope = action.payload;
    },
    setRegion: (state, action: PayloadAction<string>) => {
      state.region = action.payload;
    },
    updatePopulation: (state, action: PayloadAction<Partial<Population>>) => {
      Object.assign(state, action.payload);
    },
    updateChildInfo: (state, action: PayloadAction<ChildInfo[]>) => {
      state.children = action.payload;
    },
  },
});

export const {
  clearPopulation,
  updatePopulationId,
  updatePopulationLabel,
  markPopulationAsCreated,
  setGeographicScope,
  setRegion,
  updatePopulation,
  updateChildInfo,
} = populationSlice.actions;

export default populationSlice.reducer;

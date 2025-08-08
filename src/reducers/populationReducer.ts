import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Household } from '@/types/household';

export interface ChildInfo {
  age: string;
  income: string;
}

// Extend Population type locally to include UI-specific fields
interface Population extends Household {
  geographicScope: 'national' | 'state' | 'household' | '';
  region: string; //holds name value of selected region/state
}

const initialState: Population = {
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

export const { setGeographicScope, setRegion, updatePopulation, updateChildInfo } =
  populationSlice.actions;

export default populationSlice.reducer;

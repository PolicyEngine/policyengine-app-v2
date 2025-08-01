import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ChildInfo {
  age: string;
  income: string;
}

export interface HouseholdState {
  geographicScope: 'national' | 'state' | 'household' | '';
  maritalStatus: string;
  taxYear: string;
  numChildren: number;
  children: ChildInfo[];
}

const initialState: HouseholdState = {
  geographicScope: '',
  maritalStatus: '',
  taxYear: '',
  numChildren: 0,
  children: [],
};

export const populationSlice = createSlice({
  name: 'population',
  initialState,
  reducers: {
    setGeographicScope: (state, action: PayloadAction<HouseholdState['geographicScope']>) => {
      state.geographicScope = action.payload;
    },
    updateHousehold: (state, action: PayloadAction<Partial<HouseholdState>>) => {
      Object.assign(state, action.payload);
    },
    updateChildInfo: (state, action: PayloadAction<ChildInfo[]>) => {
      state.children = action.payload;
    },
  },
});

export const { setGeographicScope, updateHousehold, updateChildInfo } = populationSlice.actions;

export default populationSlice.reducer;

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface PolicyState {
  id: string | null;
  country_id: string;
  label?: string;
  api_version: string;
  policy_json: object;
  policy_hash: string;
}

const initialState: PolicyState = {
  id: null,
  country_id: '',
  label: undefined,
  api_version: '',
  policy_json: {},
  policy_hash: '',
};

// TODO: Some of this code is a bit naive
export const policySlice = createSlice({
  name: 'policy',
  initialState,
  reducers: {
    setPolicy: (state, action: PayloadAction<PolicyState>) => {
      state.id = action.payload.id;
      state.country_id = action.payload.country_id;
      state.label = action.payload.label;
      state.api_version = action.payload.api_version;
      state.policy_json = action.payload.policy_json;
      state.policy_hash = action.payload.policy_hash;
    },
    clearPolicy: (state) => {
      state.id = null;
      state.country_id = '';
      state.label = undefined;
      state.api_version = '';
      state.policy_json = {};
      state.policy_hash = '';
    },
    updatePolicy: (state, action: PayloadAction<Partial<PolicyState>>) => {
      if (action.payload.id !== undefined) {
        state.id = action.payload.id;
      }
      if (action.payload.country_id !== undefined) {
        state.country_id = action.payload.country_id;
      }
      if (action.payload.label !== undefined) {
        state.label = action.payload.label;
      }
      if (action.payload.api_version !== undefined) {
        state.api_version = action.payload.api_version;
      }
      if (action.payload.policy_json !== undefined) {
        state.policy_json = action.payload.policy_json;
      }
      if (action.payload.policy_hash !== undefined) {
        state.policy_hash = action.payload.policy_hash;
      }
    },
    updateLabel: (state, action: PayloadAction<string>) => {
      console.log('Updating policy label in reducer:', action.payload);

      state.label = action.payload;
    },
  },
});

// Action creators are generated for each case reducer function
export const { setPolicy, clearPolicy, updatePolicy, updateLabel } = policySlice.actions;

export default policySlice.reducer;

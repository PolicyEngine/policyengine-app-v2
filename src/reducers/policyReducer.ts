import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ValueInterval, ValueIntervalCollection } from '@/types/valueInterval';

export interface PolicyState {
  id: string | null;
  countryId: string;
  label?: string;
  apiVersion: string;
  // policy_json: object; // TODO: Change this to a collection of params; can they be a type we already have?
  policyParams: ValueInterval[]; // Redux requires serializable state, so we use ValueInterval[] instead of ValueIntervalCollection
  policyHash: string;
}

const initialState: PolicyState = {
  id: null,
  countryId: '',
  label: undefined,
  apiVersion: '',
  // policy_json: {},
  policyParams: [],
  policyHash: '',
};

// TODO: Some of this code is a bit naive
export const policySlice = createSlice({
  name: 'policy',
  initialState,
  reducers: {
    addPolicyParam: (state, action: PayloadAction<ValueInterval>) => {
      const newParam = action.payload;
      const paramCollection = new ValueIntervalCollection(state.policyParams);
      paramCollection.addInterval(newParam);
      state.policyParams = paramCollection.getIntervals();
    },
    setPolicy: (state, action: PayloadAction<PolicyState>) => {
      state.id = action.payload.id;
      state.countryId = action.payload.countryId;
      state.label = action.payload.label;
      state.apiVersion = action.payload.apiVersion;
      state.policyParams = action.payload.policyParams;
      state.policyHash = action.payload.policyHash;
    },
    clearPolicy: (state) => {
      state.id = null;
      state.countryId = '';
      state.label = undefined;
      state.apiVersion = '';
      state.policyParams = [];
      state.policyHash = '';
    },
    updatePolicy: (state, action: PayloadAction<Partial<PolicyState>>) => {
      if (action.payload.id !== undefined) {
        state.id = action.payload.id;
      }
      if (action.payload.countryId !== undefined) {
        state.countryId = action.payload.countryId;
      }
      if (action.payload.label !== undefined) {
        state.label = action.payload.label;
      }
      if (action.payload.apiVersion !== undefined) {
        state.apiVersion = action.payload.apiVersion;
      }
      /*
      if (action.payload.policy_json !== undefined) {
        state.policy_json = action.payload.policy_json;
      }
      if (action.payload.policy_hash !== undefined) {
        state.policy_hash = action.payload.policy_hash;
      }
        */
    },
    updateLabel: (state, action: PayloadAction<string>) => {
      console.log('Updating policy label in reducer:', action.payload);

      state.label = action.payload;
    },
  },
});

// Action creators are generated for each case reducer function
export const { addPolicyParam, setPolicy, clearPolicy, updatePolicy, updateLabel } =
  policySlice.actions;

export default policySlice.reducer;

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ValueInterval, ValueIntervalCollection } from '@/types/valueInterval';

export interface PolicyState {
  label?: string;
  params: ParamState[];
}

export interface ParamState {
  name: string;
  values: ValueInterval[]; // Redux requires serializable state, so we use ValueInterval[] instead of ValueIntervalCollection
}

export interface PolicyParamAdditionPayload {
  name: string;
  valueInterval: ValueInterval;
}

export function getParamByName(policy: PolicyState, name: string): ParamState | undefined {
  return policy.params.find((param) => param.name === name);
}

const initialState: PolicyState = {
  label: undefined,
  params: [],
};

// TODO: Some of this code is a bit naive
export const policySlice = createSlice({
  name: 'policy',
  initialState,
  reducers: {
    addPolicyParam: (state, action: PayloadAction<PolicyParamAdditionPayload>) => {
      const { name, valueInterval } = action.payload;

      let param = getParamByName(state, name);
      if (!param) {
        param = { name, values: [] }
        state.params.push(param);
      }

      const paramCollection = new ValueIntervalCollection(param.values);
      paramCollection.addInterval(valueInterval);
      param.values = paramCollection.getIntervals();
    },

    clearPolicy: (state) => {
      state.label = undefined;
      state.params = [];
    },
    updatePolicy: (state, action: PayloadAction<Partial<PolicyState>>) => {
      if (action.payload.label !== undefined) {
        state.label = action.payload.label;
      }
    },
    updateLabel: (state, action: PayloadAction<string>) => {
      state.label = action.payload;
    },
  },
});

// Action creators are generated for each case reducer function
export const { addPolicyParam, clearPolicy, updatePolicy, updateLabel } =
  policySlice.actions;

export default policySlice.reducer;

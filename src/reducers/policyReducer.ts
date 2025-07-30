import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ValueInterval, ValueIntervalCollection } from '@/types/valueInterval';
import { Policy } from '@/types/policy';
import { getParameterByName } from '@/types/parameter';

export interface PolicyParamAdditionPayload {
  name: string;
  valueInterval: ValueInterval;
}

const initialState: Policy = {
  label: undefined,
  params: [],
};

export const policySlice = createSlice({
  name: 'policy',
  initialState,
  reducers: {
    addPolicyParam: (state, action: PayloadAction<PolicyParamAdditionPayload>) => {
      const { name, valueInterval } = action.payload;

      let param = getParameterByName(state, name);
      if (!param) {
        param = { name, values: [] };
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
    updatePolicy: (state, action: PayloadAction<Partial<Policy>>) => {
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
export const { addPolicyParam, clearPolicy, updatePolicy, updateLabel } = policySlice.actions;

export default policySlice.reducer;

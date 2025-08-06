import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { getParameterByName } from '@/types/parameter';
import { Policy } from '@/types/policy';
import { ValueInterval, ValueIntervalCollection } from '@/types/valueInterval';

export interface PolicyParamAdditionPayload {
  name: string;
  valueInterval: ValueInterval;
}

interface PolicyState extends Policy {
  isCreated: boolean;
  id: string | undefined; // TODO: Check type on this
}

const initialState: PolicyState = {
  id: undefined,
  label: undefined,
  params: [],
  isCreated: false,
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
      state.isCreated = false;
      state.id = undefined;
    },
    updateId: (state, action: PayloadAction<string>) => {
      state.id = action.payload;
    },
    updateLabel: (state, action: PayloadAction<string>) => {
      state.label = action.payload;
    },
    markPolicyAsCreated: (state) => {
      state.isCreated = true;
    },
  },
});

// Action creators are generated for each case reducer function
export const { addPolicyParam, clearPolicy, updateLabel, updateId, markPolicyAsCreated } = policySlice.actions;

export default policySlice.reducer;

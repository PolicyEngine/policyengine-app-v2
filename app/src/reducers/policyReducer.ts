import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Policy } from '@/types/ingredients/Policy';
import { getParameterByName } from '@/types/subIngredients/parameter';
import { ValueInterval, ValueIntervalCollection } from '@/types/subIngredients/valueInterval';

export interface PolicyParamAdditionPayload {
  name: string;
  valueInterval: ValueInterval;
}

const initialState: Policy = {
  id: undefined,
  label: null,
  parameters: [],
  isCreated: false,
};

export const policySlice = createSlice({
  name: 'policy',
  initialState,
  reducers: {
    addPolicyParam: (state, action: PayloadAction<PolicyParamAdditionPayload>) => {
      const { name, valueInterval } = action.payload;

      if (!state.parameters) {
        state.parameters = [];
      }

      let param = getParameterByName(state, name);
      if (!param) {
        param = { name, values: [] };
        state.parameters.push(param);
      }

      const paramCollection = new ValueIntervalCollection(param.values);
      paramCollection.addInterval(valueInterval);
      param.values = paramCollection.getIntervals();
    },

    clearPolicy: (state) => {
      state.label = null;
      state.parameters = [];
      state.isCreated = false;
      state.id = undefined;
    },
    updatePolicyId: (state, action: PayloadAction<string>) => {
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
export const { addPolicyParam, clearPolicy, updateLabel, updatePolicyId, markPolicyAsCreated } =
  policySlice.actions;

export default policySlice.reducer;

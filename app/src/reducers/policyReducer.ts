import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Parameter } from '@/types/subIngredients/parameter';
import { ValueInterval, ValueIntervalCollection } from '@/types/subIngredients/valueInterval';

export interface PolicyParamAdditionPayload {
  name: string;
  valueInterval: ValueInterval;
}

// PolicyState represents the mutable state for building a policy
// It doesn't extend the immutable Policy type but contains the fields we need
interface PolicyState {
  id: string | undefined;
  label: string | undefined;
  params: Parameter[];
  isCreated: boolean;
}

const initialState: PolicyState = {
  id: undefined,
  label: undefined,
  params: [],
  isCreated: false,
};

// Helper function to find parameter by name
function getParameterByName(state: PolicyState, name: string): Parameter | undefined {
  return state.params.find((param) => param.name === name);
}

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

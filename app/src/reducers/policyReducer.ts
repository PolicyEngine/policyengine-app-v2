import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Policy } from '@/types/ingredients/Policy';
import { getParameterByName } from '@/types/subIngredients/parameter';
import { ValueInterval, ValueIntervalCollection } from '@/types/subIngredients/valueInterval';

export interface PolicyParamAdditionPayload {
  position: 0 | 1;
  name: string;
  valueInterval: ValueInterval;
}

// Position-based storage for exactly 2 policies
interface PolicyState {
  policies: [Policy | null, Policy | null];
}

const initialState: PolicyState = {
  policies: [null, null],
};

export const policySlice = createSlice({
  name: 'policy',
  initialState,
  reducers: {
    // Create/replace policy at position
    createPolicyAtPosition: (
      state,
      action: PayloadAction<{
        position: 0 | 1;
        policy?: Partial<Policy>;
      }>
    ) => {
      const newPolicy: Policy = {
        id: undefined,
        label: null,
        parameters: [],
        isCreated: false,
        ...action.payload.policy,
      };
      state.policies[action.payload.position] = newPolicy;
    },

    // Update policy at position
    updatePolicyAtPosition: (
      state,
      action: PayloadAction<{
        position: 0 | 1;
        updates: Partial<Policy>;
      }>
    ) => {
      const policy = state.policies[action.payload.position];
      if (!policy) {
        throw new Error(`Cannot update policy at position ${action.payload.position}: no policy exists at that position`);
      }
      state.policies[action.payload.position] = {
        ...policy,
        ...action.payload.updates,
      };
    },

    // Add parameter to policy at position
    addPolicyParamAtPosition: (state, action: PayloadAction<PolicyParamAdditionPayload>) => {
      const { position, name, valueInterval } = action.payload;
      const policy = state.policies[position];

      if (!policy) {
        throw new Error(`Cannot add parameter to policy at position ${position}: no policy exists at that position`);
      }

      if (!policy.parameters) {
        policy.parameters = [];
      }

      let param = getParameterByName(policy, name);
      if (!param) {
        param = { name, values: [] };
        policy.parameters.push(param);
      }

      const paramCollection = new ValueIntervalCollection(param.values);
      paramCollection.addInterval(valueInterval);
      param.values = paramCollection.getIntervals();
    },

    // Clear policy at position
    clearPolicyAtPosition: (state, action: PayloadAction<0 | 1>) => {
      state.policies[action.payload] = null;
    },

    // Clear all policies
    clearAllPolicies: (state) => {
      state.policies = [null, null];
    },
  },
});

// Action creators are generated for each case reducer function
export const {
  createPolicyAtPosition,
  updatePolicyAtPosition,
  addPolicyParamAtPosition,
  clearPolicyAtPosition,
  clearAllPolicies,
} = policySlice.actions;

// Selectors
export const selectPolicyAtPosition = (
  state: { policy: PolicyState },
  position: 0 | 1
): Policy | null => {
  return state.policy?.policies[position] || null;
};

export const selectAllPolicies = (
  state: { policy: PolicyState }
): Policy[] => {
  const policies: Policy[] = [];
  const [policy1, policy2] = state.policy?.policies || [null, null];
  if (policy1) policies.push(policy1);
  if (policy2) policies.push(policy2);
  return policies;
};

export const selectHasPolicyAtPosition = (
  state: { policy: PolicyState },
  position: 0 | 1
): boolean => {
  return state.policy?.policies[position] !== null;
};

export default policySlice.reducer;

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Policy } from '@/types/ingredients/Policy';
import { getParameterByName } from '@/types/subIngredients/parameter';
import { ValueInterval, ValueIntervalCollection } from '@/types/subIngredients/valueInterval';

// Helper to detect Immer Proxy objects
function isProxy(obj: any): boolean {
  return obj != null && typeof obj === 'object' && obj.constructor?.name === 'DraftObject';
}

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
    /**
     * Creates a policy at the specified position if one doesn't already exist.
     * If a policy already exists at that position, this action does nothing,
     * preserving the existing policy data.
     * @param position - The position (0 or 1) where the policy should be created
     * @param policy - Optional partial policy data to initialize with
     */
    createPolicyAtPosition: (
      state,
      action: PayloadAction<{
        position: 0 | 1;
        policy?: Partial<Policy>;
      }>
    ) => {
      const { position, policy } = action.payload;
      const currentPolicy = state.policies[position];

      console.log('[POLICY REDUCER] ========== createPolicyAtPosition START ==========');
      console.log('[POLICY REDUCER] Action payload:', { position, policy });
      console.log('[POLICY REDUCER] Full state.policies:', state.policies);
      console.log('[POLICY REDUCER] Current policy at position:', currentPolicy);
      console.log('[POLICY REDUCER] typeof currentPolicy:', typeof currentPolicy);
      console.log('[POLICY REDUCER] currentPolicy === null:', currentPolicy === null);
      console.log('[POLICY REDUCER] currentPolicy === undefined:', currentPolicy === undefined);
      console.log('[POLICY REDUCER] isProxy(currentPolicy):', isProxy(currentPolicy));
      console.log('[POLICY REDUCER] !currentPolicy:', !currentPolicy);

      if (currentPolicy) {
        console.log('[POLICY REDUCER] Policy contents:', {
          id: currentPolicy.id,
          label: currentPolicy.label,
          parametersLength: currentPolicy.parameters?.length,
          isCreated: currentPolicy.isCreated,
        });
      }

      // Only create if no policy exists at this position
      if (!state.policies[position]) {
        const newPolicy: Policy = {
          id: undefined,
          label: null,
          parameters: [],
          isCreated: false,
          ...policy,
        };
        console.log('[POLICY REDUCER] Creating new policy:', newPolicy);
        state.policies[position] = newPolicy;
        console.log(
          '[POLICY REDUCER] After assignment, state.policies[position]:',
          state.policies[position]
        );
        console.log(
          '[POLICY REDUCER] After assignment, isProxy?:',
          isProxy(state.policies[position])
        );
      } else {
        console.log('[POLICY REDUCER] Policy already exists, preserving existing data');
      }
      console.log('[POLICY REDUCER] ========== createPolicyAtPosition END ==========');
    },

    // Update policy at position
    updatePolicyAtPosition: (
      state,
      action: PayloadAction<{
        position: 0 | 1;
        updates: Partial<Policy>;
      }>
    ) => {
      console.log('[POLICY REDUCER] ========== updatePolicyAtPosition START ==========');
      console.log('[POLICY REDUCER] Position:', action.payload.position);
      console.log('[POLICY REDUCER] Updates:', action.payload.updates);

      const policy = state.policies[action.payload.position];
      console.log('[POLICY REDUCER] Current policy:', policy);
      console.log('[POLICY REDUCER] isProxy(policy)?:', isProxy(policy));

      if (!policy) {
        throw new Error(
          `Cannot update policy at position ${action.payload.position}: no policy exists at that position`
        );
      }
      state.policies[action.payload.position] = {
        ...policy,
        ...action.payload.updates,
      };
      console.log('[POLICY REDUCER] Updated policy:', state.policies[action.payload.position]);
      console.log('[POLICY REDUCER] ========== updatePolicyAtPosition END ==========');
    },

    // Add parameter to policy at position
    addPolicyParamAtPosition: (state, action: PayloadAction<PolicyParamAdditionPayload>) => {
      const { position, name, valueInterval } = action.payload;
      const policy = state.policies[position];

      console.log('[POLICY REDUCER] addPolicyParamAtPosition - START');
      console.log('[POLICY REDUCER] policy:', policy);
      console.log('[POLICY REDUCER] policy is Proxy?', isProxy(policy));

      if (!policy) {
        throw new Error(
          `Cannot add parameter to policy at position ${position}: no policy exists at that position`
        );
      }

      if (!policy.parameters) {
        policy.parameters = [];
      }

      let param = getParameterByName(policy, name);
      console.log('[POLICY REDUCER] param:', param);
      console.log('[POLICY REDUCER] param is Proxy?', isProxy(param));

      if (!param) {
        param = { name, values: [] };
        policy.parameters.push(param);
      }

      console.log('[POLICY REDUCER] param.values before collection:', param.values);
      console.log('[POLICY REDUCER] param.values is Proxy?', isProxy(param.values));

      const paramCollection = new ValueIntervalCollection(param.values);
      paramCollection.addInterval(valueInterval);
      const newValues = paramCollection.getIntervals();

      console.log('[POLICY REDUCER] newValues from getIntervals():', newValues);
      console.log('[POLICY REDUCER] newValues is Proxy?', isProxy(newValues));
      console.log(
        '[POLICY REDUCER] newValues[0] is Proxy?',
        newValues.length > 0 && isProxy(newValues[0])
      );

      param.values = newValues;
      console.log('[POLICY REDUCER] addPolicyParamAtPosition - END');
    },

    // Clear policy at position
    clearPolicyAtPosition: (state, action: PayloadAction<0 | 1>) => {
      console.log('[POLICY REDUCER] ========== clearPolicyAtPosition START ==========');
      console.log('[POLICY REDUCER] Clearing position:', action.payload);
      console.log('[POLICY REDUCER] Policy before clear:', state.policies[action.payload]);
      state.policies[action.payload] = null;
      console.log('[POLICY REDUCER] Policy after clear:', state.policies[action.payload]);
      console.log('[POLICY REDUCER] ========== clearPolicyAtPosition END ==========');
    },

    // Clear all policies
    clearAllPolicies: (state) => {
      console.log('[POLICY REDUCER] ========== clearAllPolicies START ==========');
      console.log('[POLICY REDUCER] Policies before clear:', state.policies);
      state.policies = [null, null];
      console.log('[POLICY REDUCER] Policies after clear:', state.policies);
      console.log('[POLICY REDUCER] ========== clearAllPolicies END ==========');
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

export const selectAllPolicies = (state: { policy: PolicyState }): Policy[] => {
  const policies: Policy[] = [];
  const [policy1, policy2] = state.policy?.policies || [null, null];
  if (policy1) {
    policies.push(policy1);
  }
  if (policy2) {
    policies.push(policy2);
  }
  return policies;
};

export const selectHasPolicyAtPosition = (
  state: { policy: PolicyState },
  position: 0 | 1
): boolean => {
  return state.policy?.policies[position] !== null;
};

export default policySlice.reducer;

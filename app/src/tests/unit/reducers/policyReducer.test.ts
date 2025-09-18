import { describe, expect, test } from 'vitest';
import policyReducer, {
  createPolicyAtPosition,
  updatePolicyAtPosition,
  addPolicyParamAtPosition,
  clearPolicyAtPosition,
  clearAllPolicies,
  selectPolicyAtPosition,
  selectAllPolicies,
  selectHasPolicyAtPosition,
} from '@/reducers/policyReducer';
import { Policy } from '@/types/ingredients/Policy';

// Test data
const TEST_POLICY_ID = 'policy-123';
const TEST_LABEL = 'Test Policy';
const TEST_LABEL_UPDATED = 'Updated Policy';

const mockPolicy1: Policy = {
  id: TEST_POLICY_ID,
  label: TEST_LABEL,
  parameters: [],
  isCreated: true,
};

const mockPolicy2: Policy = {
  id: 'policy-456',
  label: 'Second Policy',
  parameters: [],
  isCreated: false,
};

const emptyInitialState = {
  policies: [null, null] as [Policy | null, Policy | null],
};

describe('policyReducer', () => {
  describe('Creating Policies at Position', () => {
    test('given createPolicyAtPosition with position 0 then policy created at first slot', () => {
      // Given
      const state = emptyInitialState;

      // When
      const newState = policyReducer(state, createPolicyAtPosition({
        position: 0
      }));

      // Then
      expect(newState.policies[0]).toEqual({
        id: undefined,
        label: null,
        parameters: [],
        isCreated: false,
      });
      expect(newState.policies[1]).toBeNull();
    });

    test('given createPolicyAtPosition with position 1 then policy created at second slot', () => {
      // Given
      const state = emptyInitialState;

      // When
      const newState = policyReducer(state, createPolicyAtPosition({
        position: 1,
        policy: { label: TEST_LABEL }
      }));

      // Then
      expect(newState.policies[0]).toBeNull();
      expect(newState.policies[1]).toEqual({
        id: undefined,
        label: TEST_LABEL,
        parameters: [],
        isCreated: false,
      });
    });

    test('given createPolicyAtPosition with existing policy then preserves existing policy', () => {
      // Given
      const state = {
        policies: [mockPolicy1, null] as [Policy | null, Policy | null],
      };

      // When
      const newState = policyReducer(state, createPolicyAtPosition({
        position: 0,
        policy: { label: 'New Policy' }
      }));

      // Then - existing policy should be preserved, not replaced
      expect(newState.policies[0]).toEqual(mockPolicy1);
      expect(newState.policies[0]?.label).toBe(TEST_LABEL); // Original label preserved
      expect(newState.policies[0]?.id).toBe(TEST_POLICY_ID); // Original ID preserved
    });

    test('given createPolicyAtPosition with null value then creates new policy', () => {
      // Given
      const state = {
        policies: [null, mockPolicy1] as [Policy | null, Policy | null],
      };

      // When
      const newState = policyReducer(state, createPolicyAtPosition({
        position: 0,
        policy: { label: 'New Policy' }
      }));

      // Then - new policy should be created since position was null
      expect(newState.policies[0]).toEqual({
        id: undefined,
        label: 'New Policy',
        parameters: [],
        isCreated: false,
      });
      expect(newState.policies[1]).toEqual(mockPolicy1); // Other position unchanged
    });
  });

  describe('Updating Policies at Position', () => {
    test('given updatePolicyAtPosition updates existing policy', () => {
      // Given
      const state = {
        policies: [mockPolicy1, null] as [Policy | null, Policy | null],
      };

      // When
      const newState = policyReducer(state, updatePolicyAtPosition({
        position: 0,
        updates: { label: TEST_LABEL_UPDATED }
      }));

      // Then
      expect(newState.policies[0]).toEqual({
        ...mockPolicy1,
        label: TEST_LABEL_UPDATED,
      });
    });

    test('given updatePolicyAtPosition on empty slot then throws error', () => {
      // Given
      const state = emptyInitialState;

      // When/Then
      expect(() => {
        policyReducer(state, updatePolicyAtPosition({
          position: 0,
          updates: { label: TEST_LABEL }
        }));
      }).toThrow('Cannot update policy at position 0: no policy exists at that position');
    });

    test('given updatePolicyAtPosition with multiple updates then updates all items', () => {
      // Given
      const state = {
        policies: [mockPolicy1, null] as [Policy | null, Policy | null],
      };

      // When
      const newState = policyReducer(state, updatePolicyAtPosition({
        position: 0,
        updates: {
          label: TEST_LABEL_UPDATED,
          isCreated: false,
          id: 'new-id',
        }
      }));

      // Then
      expect(newState.policies[0]).toEqual({
        ...mockPolicy1,
        label: TEST_LABEL_UPDATED,
        isCreated: false,
        id: 'new-id',
      });
    });
  });

  describe('Adding Policy Parameters at Position', () => {
    test('given addPolicyParamAtPosition adds parameter to existing policy', () => {
      // Given
      const state = {
        policies: [mockPolicy1, null] as [Policy | null, Policy | null],
      };

      // When
      const newState = policyReducer(state, addPolicyParamAtPosition({
        position: 0,
        name: 'tax_rate',
        valueInterval: {
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          value: 0.25
        }
      }));

      // Then
      expect(newState.policies[0]?.parameters).toHaveLength(1);
      expect(newState.policies[0]?.parameters[0]).toEqual({
        name: 'tax_rate',
        values: expect.arrayContaining([
          expect.objectContaining({
            startDate: '2024-01-01',
            endDate: '2024-12-31',
            value: 0.25,
          })
        ])
      });
    });

    test('given addPolicyParamAtPosition on empty slot then throws error', () => {
      // Given
      const state = emptyInitialState;

      // When/Then
      expect(() => {
        policyReducer(state, addPolicyParamAtPosition({
          position: 0,
          name: 'tax_rate',
          valueInterval: {
            startDate: '2024-01-01',
            endDate: '2024-12-31',
            value: 0.25
          }
        }));
      }).toThrow('Cannot add parameter to policy at position 0: no policy exists at that position');
    });
  });

  describe('Clearing Policies', () => {
    test('given clearPolicyAtPosition then clears specific position', () => {
      // Given
      const state = {
        policies: [mockPolicy1, mockPolicy2] as [Policy | null, Policy | null],
      };

      // When
      const newState = policyReducer(state, clearPolicyAtPosition(0));

      // Then
      expect(newState.policies[0]).toBeNull();
      expect(newState.policies[1]).toEqual(mockPolicy2);
    });

    test('given clearAllPolicies then clears all positions', () => {
      // Given
      const state = {
        policies: [mockPolicy1, mockPolicy2] as [Policy | null, Policy | null],
      };

      // When
      const newState = policyReducer(state, clearAllPolicies());

      // Then
      expect(newState.policies[0]).toBeNull();
      expect(newState.policies[1]).toBeNull();
    });
  });

  describe('Selectors', () => {
    describe('selectPolicyAtPosition', () => {
      test('given policy exists at position then returns policy', () => {
        // Given
        const state = {
          policy: {
            policies: [mockPolicy1, mockPolicy2] as [Policy | null, Policy | null],
          }
        };

        // When
        const result = selectPolicyAtPosition(state, 0);

        // Then
        expect(result).toEqual(mockPolicy1);
      });

      test('given no policy at position then returns null', () => {
        // Given
        const state = {
          policy: {
            policies: [null, mockPolicy2] as [Policy | null, Policy | null],
          }
        };

        // When
        const result = selectPolicyAtPosition(state, 0);

        // Then
        expect(result).toBeNull();
      });
    });

    describe('selectAllPolicies', () => {
      test('given two policies then returns array with both', () => {
        // Given
        const state = {
          policy: {
            policies: [mockPolicy1, mockPolicy2] as [Policy | null, Policy | null],
          }
        };

        // When
        const result = selectAllPolicies(state);

        // Then
        expect(result).toEqual([mockPolicy1, mockPolicy2]);
      });

      test('given one policy then returns array with one', () => {
        // Given
        const state = {
          policy: {
            policies: [mockPolicy1, null] as [Policy | null, Policy | null],
          }
        };

        // When
        const result = selectAllPolicies(state);

        // Then
        expect(result).toEqual([mockPolicy1]);
      });

      test('given no policies then returns empty array', () => {
        // Given
        const state = {
          policy: emptyInitialState
        };

        // When
        const result = selectAllPolicies(state);

        // Then
        expect(result).toEqual([]);
      });
    });

    describe('selectHasPolicyAtPosition', () => {
      test('given policy exists at position then returns true', () => {
        // Given
        const state = {
          policy: {
            policies: [mockPolicy1, null] as [Policy | null, Policy | null],
          }
        };

        // When
        const result = selectHasPolicyAtPosition(state, 0);

        // Then
        expect(result).toBe(true);
      });

      test('given no policy at position then returns false', () => {
        // Given
        const state = {
          policy: {
            policies: [mockPolicy1, null] as [Policy | null, Policy | null],
          }
        };

        // When
        const result = selectHasPolicyAtPosition(state, 1);

        // Then
        expect(result).toBe(false);
      });
    });
  });
});
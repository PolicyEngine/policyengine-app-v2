import { describe, expect, test } from 'vitest';
import {
  getHouseholdLoadErrorMessage,
  getPolicyLoadErrorMessage,
  getUserHouseholdAvailability,
  getUserPolicyAvailability,
  hasRequiredSimulationIngredients,
  hasUnavailableSimulationIngredients,
} from '@/utils/ingredientAvailability';

const simulation = {
  policy: { id: 'selected-policy', label: 'Selected policy', parameters: [] },
  population: {
    household: { id: 'selected-household' },
    geography: null,
    label: 'Selected household',
    type: 'household',
  },
};

function policyItem(policyId: string, error: Error | null) {
  return {
    association: { policyId },
    policy: error ? undefined : { id: policyId, parameters: [] },
    isLoading: false,
    error,
  };
}

function householdItem(householdId: string, error: Error | null) {
  return {
    association: { householdId },
    household: error ? undefined : { id: householdId },
    isLoading: false,
    error,
  };
}

describe('ingredientAvailability', () => {
  test('blocks a simulation when its selected policy has errored', () => {
    const policies = [policyItem('selected-policy', new Error('Request failed'))];
    const households = [householdItem('selected-household', null)];

    expect(
      hasUnavailableSimulationIngredients([simulation] as any, policies as any, households as any)
    ).toBe(true);
    expect(getPolicyLoadErrorMessage(policies as any, 'selected-policy')).toBe(
      'Error loading this policy'
    );
  });

  test('blocks a simulation when its selected household has errored', () => {
    const policies = [policyItem('selected-policy', null)];
    const households = [householdItem('selected-household', new Error('Request failed'))];

    expect(
      hasUnavailableSimulationIngredients([simulation] as any, policies as any, households as any)
    ).toBe(true);
    expect(getHouseholdLoadErrorMessage(households as any, 'selected-household')).toBe(
      'Error loading this population'
    );
  });

  test('does not block a simulation for an unrelated catalog error', () => {
    const policies = [policyItem('other-policy', new Error('Request failed'))];
    const households = [householdItem('selected-household', null)];

    expect(
      hasUnavailableSimulationIngredients([simulation] as any, policies as any, households as any)
    ).toBe(false);
  });

  test('returns one shared presentation for policy and household errors', () => {
    const policy = policyItem('selected-policy', new Error('Request failed'));
    const household = householdItem('selected-household', new Error('Request failed'));

    expect(getUserPolicyAvailability(policy as any)).toEqual({
      isDisabled: true,
      errorMessage: 'Error loading this policy',
    });
    expect(getUserHouseholdAvailability(household as any)).toEqual({
      isDisabled: true,
      errorMessage: 'Error loading this population',
    });
  });

  test('requires at least one fully configured simulation', () => {
    expect(hasRequiredSimulationIngredients([])).toBe(false);
    expect(hasRequiredSimulationIngredients([simulation] as any)).toBe(true);
    expect(
      hasRequiredSimulationIngredients([
        {
          ...simulation,
          policy: { ...simulation.policy, id: undefined },
        },
      ] as any)
    ).toBe(false);
    expect(
      hasRequiredSimulationIngredients([
        {
          ...simulation,
          population: {
            ...simulation.population,
            household: null,
            geography: { id: 'us', geographyId: '' },
            type: 'geography',
          },
        },
      ] as any)
    ).toBe(false);
  });
});

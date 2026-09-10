import type { UserHouseholdMetadataWithAssociation } from '@/hooks/useUserHousehold';
import type { UserPolicyWithAssociation } from '@/hooks/useUserPolicy';
import type { SimulationStateProps } from '@/types/pathwayState';

export const POLICY_LOAD_ERROR_MESSAGE = 'Error loading this policy';
export const POPULATION_LOAD_ERROR_MESSAGE = 'Error loading this population';

export interface IngredientAvailabilityPresentation {
  isDisabled: boolean;
  errorMessage?: string;
}

type SelectableUserPolicy = UserPolicyWithAssociation & {
  policy: NonNullable<UserPolicyWithAssociation['policy']>;
};

type SelectableUserHousehold = UserHouseholdMetadataWithAssociation & {
  household: NonNullable<UserHouseholdMetadataWithAssociation['household']>;
};

export function isUserPolicySelectable(
  item: UserPolicyWithAssociation
): item is SelectableUserPolicy {
  return !item.isLoading && !item.error && !!item.policy;
}

export function isUserHouseholdSelectable(
  item: UserHouseholdMetadataWithAssociation
): item is SelectableUserHousehold {
  return !item.isLoading && !item.error && !!item.household;
}

export function getUserPolicyAvailability(
  item: UserPolicyWithAssociation
): IngredientAvailabilityPresentation {
  return {
    isDisabled: !isUserPolicySelectable(item),
    errorMessage: item.error ? POLICY_LOAD_ERROR_MESSAGE : undefined,
  };
}

export function getUserHouseholdAvailability(
  item: UserHouseholdMetadataWithAssociation
): IngredientAvailabilityPresentation {
  return {
    isDisabled: !isUserHouseholdSelectable(item),
    errorMessage: item.error ? POPULATION_LOAD_ERROR_MESSAGE : undefined,
  };
}

export function getLoadErrorAvailability(
  error: unknown,
  errorMessage: string
): IngredientAvailabilityPresentation {
  return {
    isDisabled: !!error,
    errorMessage: error ? errorMessage : undefined,
  };
}

export function findUserPolicyByPolicyId(
  policies: UserPolicyWithAssociation[] | undefined,
  policyId: string | null | undefined
): UserPolicyWithAssociation | undefined {
  if (!policyId) {
    return undefined;
  }

  return policies?.find((item) => item.association.policyId.toString() === policyId);
}

export function findUserHouseholdByHouseholdId(
  households: UserHouseholdMetadataWithAssociation[] | undefined,
  householdId: string | null | undefined
): UserHouseholdMetadataWithAssociation | undefined {
  if (!householdId) {
    return undefined;
  }

  return households?.find((item) => item.association.householdId.toString() === householdId);
}

export function getPolicyLoadErrorMessage(
  policies: UserPolicyWithAssociation[] | undefined,
  policyId: string | null | undefined
): string | undefined {
  const policy = findUserPolicyByPolicyId(policies, policyId);
  return policy ? getUserPolicyAvailability(policy).errorMessage : undefined;
}

export function getHouseholdLoadErrorMessage(
  households: UserHouseholdMetadataWithAssociation[] | undefined,
  householdId: string | null | undefined
): string | undefined {
  const household = findUserHouseholdByHouseholdId(households, householdId);
  return household ? getUserHouseholdAvailability(household).errorMessage : undefined;
}

export function hasUnavailableSimulationIngredients(
  simulations: SimulationStateProps[],
  policies: UserPolicyWithAssociation[] | undefined,
  households: UserHouseholdMetadataWithAssociation[] | undefined
): boolean {
  return simulations.some((simulation) => {
    const selectedPolicy = findUserPolicyByPolicyId(policies, simulation.policy.id);
    const selectedHousehold = findUserHouseholdByHouseholdId(
      households,
      simulation.population.household?.id
    );

    return (
      (!!selectedPolicy && !isUserPolicySelectable(selectedPolicy)) ||
      (!!selectedHousehold && !isUserHouseholdSelectable(selectedHousehold))
    );
  });
}

export function hasRequiredSimulationIngredients(simulations: SimulationStateProps[]): boolean {
  return (
    simulations.length > 0 &&
    !getReportPopulationError(simulations) &&
    simulations.every(
      (simulation) =>
        !!simulation.policy.id &&
        !!(simulation.population.household?.id || simulation.population.geography?.geographyId)
    )
  );
}

/** Validate actual selected ingredients, including hydrated or manually assembled state. */
export function getReportPopulationError(simulations: SimulationStateProps[]): string | null {
  const populationTypes = new Set<'household' | 'geography'>();
  for (const { population } of simulations) {
    if (population.household && population.geography) {
      return 'Each simulation must select one population. Use “Swap population” to choose a household or a geography again.';
    }
    const selectedType = population.household
      ? 'household'
      : population.geography
        ? 'geography'
        : null;
    if (!selectedType) {
      continue;
    }
    if (population.type && population.type !== selectedType) {
      return 'A simulation’s population type does not match its selected population. Use “Swap population” to choose it again.';
    }
    populationTypes.add(selectedType);
  }
  return populationTypes.size > 1
    ? 'Baseline and reform must use the same population type. Use “Swap population” to select households for both simulations or geographies for both.'
    : null;
}

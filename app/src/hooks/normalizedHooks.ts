/**
 * Centralized exports for simulation and policy hooks
 */

// Primary hooks with full data fetching
export { useUserSimulations, useUserSimulationById } from './useUserSimulations';

// Lightweight association hooks
export {
  useSimulationAssociationsByUser,
  useSimulationAssociation,
  useCreateSimulationAssociation,
} from './useUserSimulationAssociations';

export {
  usePolicyAssociationsByUser,
  usePolicyAssociation,
  useCreatePolicyAssociation,
  useUserPolicies,
} from './useUserPolicy';

export {
  useHouseholdAssociationsByUser,
  useHouseholdAssociation,
  useCreateHouseholdAssociation,
  useUserHouseholds,
} from './useUserHousehold';

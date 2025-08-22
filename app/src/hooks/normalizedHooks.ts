/**
 * Centralized exports for simulation and policy hooks
 * These hooks leverage @normy/react-query for automatic normalization
 * and intelligent caching of ingredients and their dependencies
 */

// Primary hooks with full data fetching
export { 
  useUserSimulations,
  useUserSimulationById
} from './useUserSimulations';

// Lightweight association hooks
export { 
  useSimulationAssociationsByUser,
  useSimulationAssociation,
  useCreateSimulationAssociation
} from './useUserSimulationAssociations';

export {
  usePolicyAssociationsByUser,
  usePolicyAssociation,
  useCreatePolicyAssociation,
  useUserPolicies
} from './useUserPolicy';

export {
  useHouseholdAssociationsByUser,
  useHouseholdAssociation,
  useCreateHouseholdAssociation,
  useUserHouseholds
} from './useUserHousehold';

// Utility hooks for normalized data access
export {
  useNormalizedData,
  useAllEntities,
  useSearchEntities,
  useManualNormalization
} from './utils/normalizedUtils';

/**
 * Usage Guide:
 * 
 * ## Full Data Hooks (for detailed views)
 * 
 * ```typescript
 * // Get all user simulations with policies and households
 * const { data, isLoading } = useUserSimulations(userId);
 * 
 * // Get a single simulation with full context
 * const { simulation, policy, household } = useUserSimulationById(userId, simId);
 * ```
 * 
 * ## Lightweight Hooks (for lists and navigation)
 * 
 * ```typescript
 * // Just get simulation associations (IDs and labels)
 * const { data } = useSimulationAssociationsByUser(userId);
 * 
 * // Just get policy associations
 * const { data } = usePolicyAssociationsByUser(userId);
 * ```
 * 
 * ## Direct Normalized Cache Access
 * 
 * ```typescript
 * // Get any entity by ID from the normalized cache
 * const policy = useNormalizedData('policies', policyId);
 * 
 * // Get all entities of a type
 * const allSimulations = useAllEntities('simulations');
 * 
 * // Search entities
 * const results = useSearchEntities('policies', 'label', searchTerm);
 * ```
 * 
 * ## Benefits with @normy/react-query:
 * 
 * - **Automatic Normalization**: Objects with 'id' fields are automatically normalized
 * - **Data Sharing**: Same objects are shared across all queries
 * - **Automatic Updates**: Mutations update all references automatically
 * - **Cache First**: Always checks cache before fetching
 * - **Type Safety**: Full TypeScript support throughout
 */
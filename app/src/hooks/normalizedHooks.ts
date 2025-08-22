/**
 * Centralized exports for all normalized hooks
 * These hooks provide intelligent caching and normalized data structures
 * for easy access to ingredients and their dependencies
 */

export { 
  useUserPoliciesNormalized, 
  useUserPolicyNormalized 
} from './useUserPolicyNormalized';

export { 
  useUserSimulationsNormalized 
} from './useUserSimulationNormalized';

export { 
  useUserReportsNormalized, 
  useUserReportNormalized 
} from './useUserReportNormalized';

/**
 * Usage Examples:
 * 
 * 1. Get all user policies with normalized access:
 * ```typescript
 * const { entities, getPolicy, getUserPolicy } = useUserPoliciesNormalized(userId);
 * const specificPolicy = getPolicy('policy-123');
 * ```
 * 
 * 2. Get user simulations with all dependencies:
 * ```typescript
 * const { entities, getSimulation, getPolicy } = useUserSimulationsNormalized(userId);
 * // Access simulation with its policy already loaded
 * const simulation = getSimulation('sim-123');
 * const policy = getPolicy(simulation.policyId);
 * ```
 * 
 * 3. Get user reports with complete dependency tree:
 * ```typescript
 * const { getFullReportData } = useUserReportsNormalized(userId);
 * const reportWithAllDeps = getFullReportData('report-123');
 * // This includes the report, its simulations, and their policies
 * ```
 * 
 * Benefits:
 * - Automatic caching: Only fetches data not already in React Query cache
 * - Normalized structure: Easy lookup by ID without nested loops
 * - Dependency fetching: Automatically fetches related entities
 * - Type safety: Full TypeScript support
 * - Performance: Parallel fetching of all required data
 */
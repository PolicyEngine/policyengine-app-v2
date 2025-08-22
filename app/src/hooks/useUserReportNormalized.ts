import { 
  reportSchema,
  simulationSchema, 
  policySchema, 
  userReportSchema,
  userSimulationSchema,
  userPolicySchema
} from '@/schemas/ingredientSchemas';
import { useUserSimulationsNormalized } from './useUserSimulationNormalized';
import { Policy } from '@/types/ingredients/Policy';
import { Simulation } from '@/types/ingredients/Simulation';
import { Report } from '@/types/ingredients/Report';
import { UserPolicy } from '@/types/ingredients/UserPolicy';
import { UserSimulation } from '@/types/ingredients/UserSimulation';
import { UserReport } from '@/types/ingredients/UserReport';
import {
  NormalizedData,
  normalizeData,
  createDenormalizer,
  mergeEntities,
} from './utils/normalizedUtils';

interface ReportNormalizedData extends NormalizedData {
  entities: {
    policies?: Record<string, Policy>;
    populations?: Record<string, any>;
    simulations?: Record<string, Simulation>;
    reports?: Record<string, Report>;
    userPolicies?: Record<string, UserPolicy>;
    userPopulations?: Record<string, any>;
    userSimulations?: Record<string, UserSimulation>;
    userReports?: Record<string, UserReport>;
  };
}

// TODO: Modify this file based on API structure, etc.
/**
 * Enhanced hook that fetches user reports along with all their dependencies 
 * (simulations, policies, populations) and returns normalized data for easy access by ID
 * 
 * This hook performs intelligent caching - it only fetches data that isn't already
 * in the React Query cache, avoiding unnecessary API calls
 */
export const useUserReportsNormalized = (userId: string) => {
  // Get all user simulations with their dependencies (this includes policies)
  const {
    entities: simulationEntities,
    result: userSimulationIds,
    isLoading: simulationsLoading,
    error: simulationsError,
    getSimulation,
    getPolicy,
    getUserSimulation,
    getUserPolicy,
  } = useUserSimulationsNormalized(userId);

  // TODO: Fetch user report associations when the API is ready
  // For now, create mock report data based on simulations
  const mockReports = createMockReports(
    userId,
    userSimulationIds,
    simulationEntities
  );

  // Normalize the report data
  const normalizedReportData = normalizeData<any>(
    mockReports,
    [userReportSchema],
    simulationsLoading,
    simulationsError
  );

  // Merge entities from simulations and reports
  const mergedEntities = mergeEntities(
    simulationEntities,
    normalizedReportData.entities
  );

  const normalizedData: ReportNormalizedData = {
    entities: mergedEntities,
    result: normalizedReportData.result,
    isLoading: simulationsLoading,
    error: simulationsError,
  };

  // Create helper functions
  const getReport = createDenormalizer<Report>('reports', reportSchema);
  const getUserReport = createDenormalizer<UserReport>('userReports', userReportSchema);

  return {
    ...normalizedData,
    // Reuse helpers from simulations
    getSimulation: (id: string) => getSimulation(id),
    getPolicy: (id: string) => getPolicy(id),
    getUserSimulation: (id: string) => getUserSimulation(id),
    getUserPolicy: (id: string) => getUserPolicy(id),
    
    // Report-specific helpers
    getReport: (id: string) => getReport(id, normalizedData.entities),
    getUserReport: (id: string) => getUserReport(id, normalizedData.entities),
    
    // Convenience method to get all data for a report including all nested dependencies
    getFullReportData: (reportId: string) => {
      const userReport = normalizedData.entities.userReports?.[reportId];
      if (!userReport) return null;

      // Use denormalize to get the full nested structure
      return createDenormalizer<UserReport>(
        'userReports',
        userReportSchema
      )(reportId, normalizedData.entities);
    },
  };
};

/**
 * Hook to fetch a single user report with all its dependencies
 */
export const useUserReportNormalized = (userId: string, reportId: string) => {
  const allReports = useUserReportsNormalized(userId);
  
  return {
    ...allReports,
    data: allReports.getUserReport(reportId),
    fullData: allReports.getFullReportData(reportId),
  };
};

/**
 * Creates mock report data based on simulations
 * TODO: Replace with actual API calls when ready
 */
function createMockReports(
  userId: string,
  userSimulationIds: string[],
  simulationEntities: Record<string, any>
): any[] {
  return userSimulationIds.map((simId) => {
    const userSim = simulationEntities.userSimulations?.[simId];
    const sim = simulationEntities.simulations?.[userSim?.simulationId];
    
    return {
      id: `report-${simId}`,
      userId,
      reportId: `report-${simId}`,
      label: `Report for Simulation ${simId}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      report: {
        id: `report-${simId}`,
        countryId: 'us',
        apiVersion: 'v1',
        simulationId: sim?.id,
        reportData: {
          // Mock report data
          generated: true,
          timestamp: new Date().toISOString(),
        },
        reportHash: `hash-${simId}`,
        // Include the simulation with all its dependencies
        simulation: sim ? {
          ...sim,
          policy: simulationEntities.policies?.[sim.policyId],
          // population will be added when available
        } : undefined,
      },
      // Include the user simulation with all its associations
      userSimulation: userSim ? {
        ...userSim,
        simulation: sim,
        userPolicy: simulationEntities.userPolicies?.[userSim.userPolicyId],
      } : undefined,
    };
  });
}
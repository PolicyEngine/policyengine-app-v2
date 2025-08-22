import { useQueries, useQueryClient } from '@tanstack/react-query';
import { normalize, denormalize } from 'normy';
import { fetchSimulationById } from '@/api/simulation';
import { fetchPolicyById } from '@/api/policy';
import { SimulationAdapter, PolicyAdapter, ReportAdapter } from '@/adapters';
import { 
  reportSchema,
  simulationSchema, 
  policySchema, 
  populationSchema,
  userReportSchema,
  userSimulationSchema,
  userPolicySchema,
  userPopulationSchema 
} from '@/schemas/ingredientSchemas';
import { useUserSimulationsNormalized } from './useUserSimulationNormalized';
import { simulationKeys, policyKeys } from '../libs/queryKeys';

interface NormalizedReportData {
  entities: {
    policies?: Record<string, any>;
    populations?: Record<string, any>;
    simulations?: Record<string, any>;
    reports?: Record<string, any>;
    userPolicies?: Record<string, any>;
    userPopulations?: Record<string, any>;
    userSimulations?: Record<string, any>;
    userReports?: Record<string, any>;
  };
  result: string[];
  isLoading: boolean;
  error: Error | null;
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
  const queryClient = useQueryClient();
  const country = 'us'; // TODO: Replace with actual country ID retrieval logic

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
  // For now, we'll create mock report data based on simulations
  const mockReports = userSimulationIds.map((simId) => {
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

  // Normalize the report data
  let normalizedData: NormalizedReportData = {
    entities: {
      ...simulationEntities, // Include all entities from simulations
    },
    result: [],
    isLoading: simulationsLoading,
    error: simulationsError as Error | null,
  };

  if (!simulationsLoading && !simulationsError && mockReports.length > 0) {
    const normalized = normalize(mockReports, [userReportSchema]);
    
    // Merge entities from both normalizations
    normalizedData = {
      entities: {
        ...simulationEntities,
        ...normalized.entities,
        // Ensure we don't overwrite existing entities, just add new ones
        reports: {
          ...simulationEntities.reports,
          ...normalized.entities.reports,
        },
        userReports: {
          ...simulationEntities.userReports,
          ...normalized.entities.userReports,
        },
      },
      result: normalized.result as string[],
      isLoading: false,
      error: null,
    };
  }

  return {
    ...normalizedData,
    // Helper functions to denormalize specific entities
    getReport: (id: string) => {
      if (!normalizedData.entities.reports?.[id]) return null;
      return denormalize(id, reportSchema, normalizedData.entities);
    },
    getSimulation: (id: string) => {
      if (!normalizedData.entities.simulations?.[id]) return null;
      return denormalize(id, simulationSchema, normalizedData.entities);
    },
    getPolicy: (id: string) => {
      if (!normalizedData.entities.policies?.[id]) return null;
      return denormalize(id, policySchema, normalizedData.entities);
    },
    getUserReport: (id: string) => {
      if (!normalizedData.entities.userReports?.[id]) return null;
      return denormalize(id, userReportSchema, normalizedData.entities);
    },
    getUserSimulation: (id: string) => {
      if (!normalizedData.entities.userSimulations?.[id]) return null;
      return denormalize(id, userSimulationSchema, normalizedData.entities);
    },
    getUserPolicy: (id: string) => {
      if (!normalizedData.entities.userPolicies?.[id]) return null;
      return denormalize(id, userPolicySchema, normalizedData.entities);
    },
    // Convenience method to get all data for a report including all nested dependencies
    getFullReportData: (reportId: string) => {
      const userReport = normalizedData.entities.userReports?.[reportId];
      if (!userReport) return null;

      return denormalize(reportId, userReportSchema, normalizedData.entities);
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
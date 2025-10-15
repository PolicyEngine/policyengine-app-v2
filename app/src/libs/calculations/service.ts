import { CalculationMeta } from '@/api/reportCalculations';
import { Geography } from '@/types/ingredients/Geography';
import { Household, HouseholdData } from '@/types/ingredients/Household';
import { Simulation } from '@/types/ingredients/Simulation';
import { EconomyCalculationHandler } from './handlers/economy';
import { HouseholdCalculationHandler } from './handlers/household';
import { CalculationStatusResponse } from './status';

/**
 * Parameters for building calculation metadata
 */
export interface BuildMetadataParams {
  simulation1: Simulation | null;
  simulation2?: Simulation | null;
  household?: Household | null;
  geography?: Geography | null;
  countryId: string;
}

/**
 * CalculationService is the single source of truth for calculation logic.
 * It handles metadata construction, query configuration, and calculation execution
 * without directly managing cache (that's TanStack Query's job).
 */
export class CalculationService {
  private householdHandler: HouseholdCalculationHandler;
  private economyHandler: EconomyCalculationHandler;

  constructor() {
    this.householdHandler = new HouseholdCalculationHandler();
    this.economyHandler = new EconomyCalculationHandler();
  }

  /**
   * Build metadata from simulation and population data
   * Centralizes all metadata construction logic
   */
  buildMetadata(params: BuildMetadataParams): CalculationMeta {
    const { simulation1, simulation2, household, geography, countryId } = params;

    if (!simulation1) {
      throw new Error('Primary simulation is required');
    }

    // Determine calculation type from simulation
    const type = simulation1.populationType === 'household' ? 'household' : 'economy';

    // Extract population ID based on type
    let populationId: string;
    if (type === 'household') {
      if (!household?.id) {
        throw new Error('Household ID required for household calculation');
      }
      populationId = household.id;
    } else {
      if (!geography) {
        throw new Error('Geography required for economy calculation');
      }
      populationId = geography.geographyId || geography.id || '';
    }

    // Determine region for economy calculations
    const region =
      type === 'economy' && geography?.scope === 'subnational' && geography.geographyId
        ? geography.geographyId
        : undefined;

    // Collect simulation IDs to update with calculation results
    const simulationIds: string[] = [];
    if (simulation1.id) {
      simulationIds.push(simulation1.id);
    }
    if (simulation2?.id) {
      simulationIds.push(simulation2.id);
    }

    return {
      type,
      countryId: countryId as any,
      policyIds: {
        baseline: simulation1.policyId || '',
        reform: simulation2?.policyId,
      },
      populationId,
      region,
      simulationIds,
    };
  }

  /**
   * Get TanStack Query configuration for a calculation
   * Different configurations for household vs economy calculations
   */
  getQueryOptions(reportId: string, meta: CalculationMeta) {
    const baseOptions = {
      queryKey: ['calculation', reportId] as const,
    };

    if (meta.type === 'household') {
      return {
        ...baseOptions,
        queryFn: () => this.householdHandler.execute(reportId, meta),
        // No refetch for household - uses synthetic progress
        refetchInterval: false,
        staleTime: Infinity,
      };
    }

    // Economy calculation configuration
    return {
      ...baseOptions,
      queryFn: () => this.economyHandler.execute(reportId, meta),
      // Poll for economy calculations while computing
      refetchInterval: (query: any) => {
        const data = query.state.data as CalculationStatusResponse | undefined;
        return data?.status === 'computing' ? 1000 : false;
      },
      staleTime: 10 * 60 * 1000, // 10 minutes
    };
  }

  /**
   * Execute a calculation through the appropriate handler
   * Simple pass-through to the correct handler based on calculation type
   * @param reportId - The report ID
   * @param meta - The calculation metadata
   * @param callbacks - Optional callbacks for completion events
   */
  async executeCalculation(
    reportId: string,
    meta: CalculationMeta,
    callbacks?: {
      onComplete?: (reportId: string, status: 'ok' | 'error', result?: any) => Promise<void>;
      onSimulationComplete?: (
        simulationId: string,
        result: HouseholdData,
        policyId: string
      ) => Promise<void>;
    }
  ): Promise<CalculationStatusResponse> {
    if (meta.type === 'household') {
      return this.householdHandler.execute(reportId, meta, callbacks);
    }
    return this.economyHandler.execute(reportId, meta);
  }

  /**
   * Get the handler for a specific calculation type
   */
  getHandler(type: 'household' | 'economy') {
    return type === 'household' ? this.householdHandler : this.economyHandler;
  }

  /**
   * Get current status of a calculation if it's being tracked
   */
  getStatus(reportId: string, type: 'household' | 'economy'): CalculationStatusResponse | null {
    if (type === 'household') {
      return this.householdHandler.getStatus(reportId);
    }
    // Economy doesn't track client-side
    return null;
  }
}

// Singleton instance
let serviceInstance: CalculationService | null = null;

export function getCalculationService(): CalculationService {
  if (!serviceInstance) {
    serviceInstance = new CalculationService();
  }
  return serviceInstance;
}

export function resetCalculationService(): void {
  serviceInstance = null;
}

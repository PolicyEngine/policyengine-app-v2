import type { Report } from '@/types/ingredients/Report';

/**
 * Configuration for a single simulation calculation
 */
export interface SimulationConfig {
  simulationId: string;
  populationId: string;
  policyId: string;
}

/**
 * Configuration to start calculating a household report
 * Contains configs for all simulations in the report
 */
export interface HouseholdReportConfig {
  reportId: string;
  countryId: string;
  report: Report; // Full report object for marking complete when done
  simulationConfigs: SimulationConfig[];
}

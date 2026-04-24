import { countryIds } from '@/libs/countries';

export type SimulationPopulationType = 'household' | 'geography';
export type SimulationType = 'household' | 'economy';
export type SimulationStatus = 'pending' | 'complete' | 'error';
export type SimulationSource = 'v1_api' | 'v2_household_api' | 'v2_economy_api';

/**
 * Simulation type for position-based storage
 * ID is optional and only exists after API creation
 * The populationId can be either a household ID or geography ID
 * The Simulation is agnostic to which type of population it references
 *
 * STATUS VALUES (matches API):
 * - 'pending': Not yet calculated OR currently calculating
 * - 'complete': Calculation finished and persisted
 * - 'error': Calculation failed
 *
 * Note: Frontend uses CalcStatus.status='computing' for ephemeral real-time tracking,
 * but Simulation.status uses 'pending' for the persistent database state.
 */
export interface Simulation {
  id?: string; // Optional - only exists after API creation
  countryId?: (typeof countryIds)[number];
  apiVersion?: string;
  simulationType?: SimulationType;
  policyId?: string;
  populationId?: string; // Can be either householdId or geographyId
  populationType?: SimulationPopulationType; // Indicates the type of populationId
  year?: number | null;
  label: string | null; // Always present, even if null
  isCreated: boolean; // Always present, defaults to false
  output?: unknown | null; // Calculation result (for household simulations)
  status?: SimulationStatus; // Calculation status (matches API)
  source?: SimulationSource;
  backendStatus?: string | null;
  regionCode?: string | null;
  datasetId?: string | null;
  outputDatasetId?: string | null;
  filterField?: string | null;
  filterValue?: string | null;
  errorMessage?: string | null;
}

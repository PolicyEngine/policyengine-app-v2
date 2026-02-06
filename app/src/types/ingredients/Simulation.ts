import { countryIds } from '@/libs/countries';

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
 *
 * In V2 API:
 * - policyId = null → current law (baseline)
 * - policyId = UUID string → reform policy
 * - policyId = undefined → not yet configured
 */
export interface Simulation {
  id?: string; // Optional - only exists after API creation
  countryId?: (typeof countryIds)[number];
  apiVersion?: string;
  policyId?: string | null; // null = current law (V2), string = reform, undefined = not set
  populationId?: string; // Can be either householdId or geographyId
  populationType?: 'household' | 'geography'; // Indicates the type of populationId
  label: string | null; // Always present, even if null
  isCreated: boolean; // Always present, defaults to false
  output?: unknown | null; // Calculation result (for household simulations)
  status?: 'pending' | 'complete' | 'error'; // Calculation status (matches API)
}

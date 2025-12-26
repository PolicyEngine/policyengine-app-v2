import { countryIds } from '@/libs/countries';

/**
 * Simulation metadata as returned by the API
 * This represents the API's response format (snake_case fields)
 *
 * STATUS VALUES (matches API):
 * - 'pending': Not yet calculated OR currently calculating
 * - 'complete': Calculation finished and persisted
 * - 'error': Calculation failed
 */
export interface SimulationMetadata {
  id: number;
  country_id: (typeof countryIds)[number];
  api_version: string;
  population_id: string;
  population_type: 'household' | 'geography';
  policy_id: string;
  output?: unknown | null;
  status?: 'pending' | 'complete' | 'error'; // Matches API contract
}

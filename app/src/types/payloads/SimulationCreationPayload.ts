/**
 * Payload format for creating a simulation via the API
 * Backend expects policy_id as integer
 */
export interface SimulationCreationPayload {
  population_id: string;  // Stays string (can be household ID or geography code)
  population_type?: 'household' | 'geography';
  policy_id?: number;  // Changed from string to match backend validation
}

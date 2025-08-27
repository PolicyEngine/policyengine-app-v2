/**
 * Payload format for creating a simulation via the API
 */
export interface SimulationCreationPayload {
  population_id: string;
  population_type?: 'household' | 'geography';
  policy_id?: string;
}

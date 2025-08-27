/**
 * Payload format for creating a user-simulation association via the API
 */
export interface UserSimulationCreationPayload {
  userId: string;
  simulationId: string;
  label?: string;
  updatedAt?: string;
}

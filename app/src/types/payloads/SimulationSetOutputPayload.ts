/**
 * Payload format for updating a simulation's output via the API
 * Note: Simulation PATCH takes id in body, not URL
 * Note: Now accepts status field (matching report PATCH format)
 */
export interface SimulationSetOutputPayload {
  id: number;
  status: 'pending' | 'complete' | 'error';
  output?: string | null; // JSON-stringified output or null
  error_message?: string | null; // Optional error message for error status
}

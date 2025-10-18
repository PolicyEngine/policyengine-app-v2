/**
 * Payload format for updating a simulation's output via the API
 * Note: Unlike reports, simulation PATCH takes id in body, not URL
 * Note: Uses output_json (string) not output, and doesn't accept status
 */
export interface SimulationSetOutputPayload {
  id: number;
  output_json: string; // JSON-stringified output or "null"
}

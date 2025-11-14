/**
 * Payload format for creating a report via the API
 * Backend expects simulation IDs and year, generates ID and timestamps
 */
export interface ReportCreationPayload {
  simulation_1_id: number;
  simulation_2_id: number | null;
  year: string; // Report calculation year (e.g., '2025')
}

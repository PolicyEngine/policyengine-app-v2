/**
 * Payload format for creating a report via the API
 * Backend expects only simulation IDs, generates ID and timestamps
 */
export interface ReportCreationPayload {
  simulation_1_id: string;
  simulation_2_id: string | null;
}

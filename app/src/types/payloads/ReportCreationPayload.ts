/**
 * Payload format for creating a report via the API
 * Backend expects only simulation IDs (as integers), generates ID and timestamps
 */
export interface ReportCreationPayload {
  simulation_1_id: number;
  simulation_2_id: number | null;
}

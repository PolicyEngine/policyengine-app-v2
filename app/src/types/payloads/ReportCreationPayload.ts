/**
 * Payload format for creating a report via the API
 */
export interface ReportCreationPayload {
  report_id: string;
  simulation_1_id: string;
  simulation_2_id: string | null;
  status: 'pending' | 'complete' | 'error';
  created_at: string;
  updated_at: string;
}

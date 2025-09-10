/**
 * Payload format for updating a report's output via the API
 */
export interface ReportSetOutputPayload {
  report_id: string;
  status: 'pending' | 'complete' | 'error';
  output: string | null; // JSON-stringified object or null
  updated_at: string;
}
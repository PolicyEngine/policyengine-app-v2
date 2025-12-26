/**
 * Payload format for updating a report's output via the API
 * Note: Report PATCH takes id in body, not URL path
 */
export interface ReportSetOutputPayload {
  id: number;
  status: 'pending' | 'complete' | 'error';
  output?: string | null; // JSON-stringified output or null
  error_message?: string | null; // Optional error message for error status
}

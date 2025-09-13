/**
 * Payload format for updating a report's output via the API
 */
export interface ReportSetOutputPayload {
  id: number;
  status: 'pending' | 'complete' | 'error';
  output: string | null; // JSON-stringified object or null
  error_message?: string | null; // Optional error message
}

/**
 * Payload format for updating a report's output via the API
 * Note: The report ID is passed in the URL path, not in the payload
 */
export interface ReportSetOutputPayload {
  status: 'pending' | 'complete' | 'error';
  output: string | null; // JSON-stringified object or null
}

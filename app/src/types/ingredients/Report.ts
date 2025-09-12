/**
 * Placeholder for report output structure
 * TODO: Update this when we have a clearer sense of the report output structure
 */
export interface ReportOutput {
  [key: string]: any;
}

/**
 * Base Report type
 */
export interface Report {
  reportId?: string; // Optional - populated after creation like Policy
  simulationIds: string[];
  status: 'pending' | 'complete' | 'error';
  output: ReportOutput | null; // Parsed API response or null
  createdAt?: string; // Optional - populated by backend
  updatedAt?: string; // Optional - populated by backend
}

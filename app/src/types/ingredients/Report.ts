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
  reportId: string;
  simulationIds: string[];
  status: 'pending' | 'complete' | 'error';
  output: ReportOutput | null; // Parsed API response or null
  createdAt: string;
  updatedAt: string;
}

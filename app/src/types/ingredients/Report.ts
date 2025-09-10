/**
 * Base Report type
 */
export interface Report {
  reportId: string;
  simulationIds: string[];
  status: 'pending' | 'complete' | 'error';
  // TODO: Modify this when we have a clearer sense of the report output structure
  output: Record<string, any> | null; // API response or null
  createdAt: string;
  updatedAt: string;
}

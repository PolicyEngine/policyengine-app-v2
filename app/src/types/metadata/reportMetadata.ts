export interface ReportMetadata {
  report_id: string;
  simulation_1_id: string;
  simulation_2_id: string | null;
  status: 'pending' | 'complete' | 'error';
  // TODO: Change "output" when we have a clearer sense of the report output structure
  output: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}
export interface ReportMetadata {
  id: string;
  simulation_1_id: string;
  simulation_2_id: string | null;
  status: 'pending' | 'complete' | 'error';
  output: string | null; // JSON-stringified object or null
  created_at: string;
  updated_at: string;
}

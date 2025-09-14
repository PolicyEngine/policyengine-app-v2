export interface ReportMetadata {
  id: number;
  simulation_1_id: number;
  simulation_2_id: number | null;
  status: 'pending' | 'complete' | 'error';
  output: string | null; // JSON-stringified object or null
  created_at: string;
  updated_at: string;
}

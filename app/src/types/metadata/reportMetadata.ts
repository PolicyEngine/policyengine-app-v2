import { countryIds } from '@/libs/countries';

export interface ReportMetadata {
  id: number;
  country_id: (typeof countryIds)[number];
  simulation_1_id: string;
  simulation_2_id: string | null;
  year: string; // Report calculation year (e.g., '2025')
  api_version: string;
  status: 'pending' | 'complete' | 'error';
  requested_at?: string | null;
  started_at?: string | null;
  finished_at?: string | null;
  output: string | null; // JSON-stringified object or null
}

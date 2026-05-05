import { countryIds } from '@/libs/countries';

export interface ReportMetadata {
  id: number;
  country_id: (typeof countryIds)[number];
  simulation_1_id: string;
  simulation_2_id: string | null;
  year: string; // Report calculation year (e.g., '2025')
  api_version: string;
  status: 'pending' | 'running' | 'complete' | 'error';
  output: string | null; // JSON-stringified object or null
  requested_at?: string | null; // Base report execution timestamp from API v1 report run
  started_at?: string | null; // Base report execution timestamp from API v1 report run
  finished_at?: string | null; // Base report execution timestamp from API v1 report run
}

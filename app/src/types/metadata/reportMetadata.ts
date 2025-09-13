import { countryIds } from "@/libs/countries";

export interface ReportMetadata {
  id: number;
  country_id: (typeof countryIds)[number];
  simulation_1_id: string;
  simulation_2_id: string | null;
  api_version: string;
  status: 'pending' | 'complete' | 'error';
  output: string | null; // JSON-stringified object or null
  created_at: string;
  updated_at: string;
}

import { countryIds } from '@/libs/countries';

export interface SimulationMetadata {
  id: number;
  country_id: (typeof countryIds)[number];
  api_version: string;
  population_id: string;
  population_type: 'household' | 'geography';
  policy_id: string;
  output_json?: string | null; // JSON string of household calculation output (household simulations only)
}

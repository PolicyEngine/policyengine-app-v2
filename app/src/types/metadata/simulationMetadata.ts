import { countryIds } from '@/libs/countries';

export interface SimulationMetadata {
  simulation_id: string;
  country_id: (typeof countryIds)[number];
  api_version: string;
  population_id: string;
  policy_id: string;
}

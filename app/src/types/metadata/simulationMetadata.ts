import { countryIds } from '@/libs/countries';

export interface SimulationMetadata {
  id: number;  // Changed from simulation_id: string to match backend
  country_id: (typeof countryIds)[number];
  api_version: string;
  population_id: string;  // Stays string (VARCHAR in database)
  population_type: 'household' | 'geography';
  policy_id: number;  // Changed from string to match backend (INT in database)
}

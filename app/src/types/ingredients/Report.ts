import type { EconomicImpactResponse } from '@/api/v2/economyAnalysis';
import { countryIds } from '@/libs/countries';
import type { HouseholdReportOutput } from '@/types/calculation/household';
import { Household } from './Household';

export type HouseholdOutput = Household | Household[];

/**
 * Base Report type
 * For household reports: output is aggregated map of simulation IDs to their outputs
 * For economy reports: output is the v2 EconomicImpactResponse
 */
export interface Report {
  id?: string; // Optional - populated after creation like Policy
  label?: string | null; // Optional - user-defined name for the report
  countryId: (typeof countryIds)[number];
  year: string; // Report calculation year (e.g., '2025')
  apiVersion: string | null;
  simulationIds: string[];
  status: 'pending' | 'complete' | 'error';
  outputType?: 'household' | 'economy'; // Discriminator for output type
  output?: EconomicImpactResponse | HouseholdReportOutput | null;
}

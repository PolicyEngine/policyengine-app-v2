import { countryIds } from '@/libs/countries';
import { ReportOutputSocietyWideUK } from '@/types/metadata/ReportOutputSocietyWideUK';
import { ReportOutputSocietyWideUS } from '@/types/metadata/ReportOutputSocietyWideUS';
import { Household } from './Household';

export type EconomyOutput = ReportOutputSocietyWideUS | ReportOutputSocietyWideUK;
export type HouseholdOutput = Household | Household[];

/**
 * Base Report type
 * For household reports: output lives on individual simulations, not the report
 * For economy reports: output is aggregated at the report level
 */
export interface Report {
  id?: string; // Optional - populated after creation like Policy
  label?: string | null; // Optional - user-defined name for the report
  countryId: (typeof countryIds)[number];
  apiVersion: string | null;
  simulationIds: string[];
  status: 'pending' | 'complete' | 'error';
  outputType?: 'household' | 'economy'; // Discriminator for output location
  output?: EconomyOutput | null; // Only for economy reports - household outputs live on simulations
}

// Legacy export for backward compatibility
export type ReportOutput = EconomyOutput | HouseholdOutput;

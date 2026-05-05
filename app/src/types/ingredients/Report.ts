import { countryIds } from '@/libs/countries';
import type { HouseholdReportOutput } from '@/types/calculation/household';
import { ReportOutputSocietyWideUK } from '@/types/metadata/ReportOutputSocietyWideUK';
import { ReportOutputSocietyWideUS } from '@/types/metadata/ReportOutputSocietyWideUS';
import { Household } from './Household';

export type EconomyOutput = ReportOutputSocietyWideUS | ReportOutputSocietyWideUK;
export type HouseholdOutput = Household | Household[];

/**
 * Base Report type
 * For household reports: output is aggregated map of simulation IDs to their outputs
 * For economy reports: output is aggregated economy-wide calculation
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
  output?: EconomyOutput | HouseholdReportOutput | null; // Economy or household output
}

// Legacy export for backward compatibility
export type ReportOutput = EconomyOutput | HouseholdOutput;

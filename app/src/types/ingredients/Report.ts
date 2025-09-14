import { countryIds } from '@/libs/countries';

import { ReportOutputSocietyWideUS } from '@/types/metadata/ReportOutputSocietyWideUS';
import { ReportOutputSocietyWideUK } from '@/types/metadata/ReportOutputSocietyWideUK';

export type ReportOutput = ReportOutputSocietyWideUS | ReportOutputSocietyWideUK;

/**
 * Base Report type
 */
export interface Report {
  reportId?: string; // Optional - populated after creation like Policy
  countryId: (typeof countryIds)[number];
  apiVersion: string | null;
  simulationIds: string[];
  status: 'pending' | 'complete' | 'error';
  output: ReportOutput | null; // Parsed API response or null
  createdAt?: string; // Optional - populated by backend
  updatedAt?: string; // Optional - populated by backend
}

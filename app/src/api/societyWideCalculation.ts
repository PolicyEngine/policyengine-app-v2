import { ReportOutputSocietyWideUK } from '@/types/metadata/ReportOutputSocietyWideUK';
import { ReportOutputSocietyWideUS } from '@/types/metadata/ReportOutputSocietyWideUS';

/** Union type for v1 economy report output. Used by report output pages. */
export type SocietyWideReportOutput = ReportOutputSocietyWideUS | ReportOutputSocietyWideUK;

/**
 * Determines the dataset to use for a society-wide calculation.
 * Returns 'enhanced_cps' for US nationwide calculations, undefined otherwise.
 * This ensures Enhanced CPS is only used for US nationwide impacts, not for UK or US state-level calculations.
 *
 * @param countryId - The country ID (e.g., 'us', 'uk')
 * @param region - The region (e.g., 'us', 'ca', 'uk')
 * @returns The dataset name or undefined to use API default
 */
export function getDatasetForRegion(countryId: string, region: string): string | undefined {
  // Only use enhanced_cps for US nationwide
  if (countryId === 'us' && region === 'us') {
    return 'enhanced_cps';
  }
  // Return undefined for all other cases (UK, US states, etc.)
  return undefined;
}

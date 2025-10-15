/**
 * Utility functions for working with UK constituency data in economy reports
 */

import { EconomyReportOutput } from '@/api/economy';
import { ReportOutputSocietyWideUK } from '@/types/metadata/ReportOutputSocietyWideUK';

/**
 * Type guard to check if economy output is from UK
 */
export function isUKEconomyOutput(output: EconomyReportOutput): output is ReportOutputSocietyWideUK {
  return 'constituency_impact' in output;
}

/**
 * Extract constituency name from geographyId
 * Handles format: "constituency/Brighton Kemptown and Peacehaven" -> "Brighton Kemptown and Peacehaven"
 */
export function extractConstituencyName(geographyId: string): string | null {
  if (geographyId.startsWith('constituency/')) {
    return geographyId.replace('constituency/', '');
  }
  return null;
}

/**
 * Extract country/region name from geographyId
 * Handles format: "country/england" -> "england"
 */
export function extractCountryName(geographyId: string): string | null {
  if (geographyId.startsWith('country/')) {
    return geographyId.replace('country/', '').replace('_', ' ');
  }
  return null;
}

/**
 * Get region key from geographyId for API lookups
 * Handles format: "country/england" -> "england"
 */
export function getRegionKey(geographyId: string): string | null {
  const parts = geographyId.split('/');
  return parts.length > 1 ? parts[1] : null;
}

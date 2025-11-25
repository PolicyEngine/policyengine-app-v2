import { countryIds } from '@/libs/countries';
import { fetchHouseholdCalculation } from './householdCalculation';
import {
  fetchSocietyWideCalculation,
  SocietyWideCalculationParams,
} from './societyWideCalculation';

/**
 * Metadata needed to fetch a calculation
 * This is stored alongside the calculation in the cache when a report is created
 */
export interface CalculationMeta {
  type: 'household' | 'economy';
  countryId: (typeof countryIds)[number];
  policyIds: {
    baseline: string;
    reform?: string;
  };
  populationId: string;
  region?: string;
  year: string; // Report calculation year (e.g., '2025')
}

/**
 * Fetch calculation for a report using metadata
 */
export async function fetchCalculationWithMeta(meta: CalculationMeta) {
  if (meta.type === 'household') {
    const policyId = meta.policyIds.reform || meta.policyIds.baseline;
    const result = await fetchHouseholdCalculation(meta.countryId, meta.populationId, policyId);
    return result;
  }

  const params: SocietyWideCalculationParams = {
    region: meta.region || meta.countryId,
    time_period: meta.year,
  };

  const result = await fetchSocietyWideCalculation(
    meta.countryId,
    meta.policyIds.reform || meta.policyIds.baseline,
    meta.policyIds.baseline,
    params
  );
  return result;
}

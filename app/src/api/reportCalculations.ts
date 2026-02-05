import { countryIds } from '@/libs/countries';
import { calculateHouseholdV2Alpha } from './v2/householdCalculation';
import { fetchHouseholdByIdV2 } from './v2/households';
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
    try {
      // Fetch household then calculate using v2 alpha API
      const household = await fetchHouseholdByIdV2(meta.populationId);
      const result = await calculateHouseholdV2Alpha(household, policyId);
      return result;
    } catch (error) {
      console.error('[fetchCalculationWithMeta] Household calculation failed:', error);
      throw error;
    }
  }

  const params: SocietyWideCalculationParams = {
    region: meta.region || meta.countryId,
    time_period: meta.year,
  };

  try {
    const result = await fetchSocietyWideCalculation(
      meta.countryId,
      meta.policyIds.reform || meta.policyIds.baseline,
      meta.policyIds.baseline,
      params
    );
    return result;
  } catch (error) {
    console.error('[fetchCalculationWithMeta] Society-wide calculation failed:', error);
    throw error;
  }
}

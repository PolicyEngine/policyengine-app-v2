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
 *
 * In V2 API:
 * - null → current law (baseline)
 * - UUID string → reform policy
 */
export interface CalculationMeta {
  type: 'household' | 'economy';
  countryId: (typeof countryIds)[number];
  policyIds: {
    baseline: string | null;
    reform?: string | null;
  };
  populationId: string;
  region?: string;
  year: string; // Report calculation year (e.g., '2025')
}

/**
 * Fetch calculation for a report using metadata.
 *
 * Note: null policy IDs are converted to undefined for the API calls,
 * as V2 API interprets omitted/undefined policy_id as current law.
 */
export async function fetchCalculationWithMeta(meta: CalculationMeta) {
  if (meta.type === 'household') {
    // Use reform if present, otherwise baseline. Convert null to undefined for API.
    const policyId = (meta.policyIds.reform ?? meta.policyIds.baseline) ?? undefined;
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

  // Convert null to empty string for society-wide API (legacy v1 format)
  const reformPolicy = (meta.policyIds.reform ?? meta.policyIds.baseline) || '';
  const baselinePolicy = meta.policyIds.baseline || '';

  try {
    const result = await fetchSocietyWideCalculation(
      meta.countryId,
      reformPolicy,
      baselinePolicy,
      params
    );
    return result;
  } catch (error) {
    console.error('[fetchCalculationWithMeta] Society-wide calculation failed:', error);
    throw error;
  }
}

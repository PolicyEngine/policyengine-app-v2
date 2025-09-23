import { fetchEconomyCalculation, EconomyCalculationParams } from './economy';
import { fetchHouseholdCalculation } from './household_calculation';
import { countryIds } from '@/libs/countries';

/**
 * Metadata needed to fetch a calculation
 * This is stored alongside the calculation in the cache when a report is created
 */
export interface CalculationMeta {
  type: 'household' | 'economy';
  countryId: typeof countryIds[number];
  policyIds: {
    baseline: string;
    reform?: string;
  };
  populationId: string;
  region?: string;
}

/**
 * Fetch calculation for a report using metadata
 */
export async function fetchCalculationWithMeta(meta: CalculationMeta) {
  if (meta.type === 'household') {
    const policyId = meta.policyIds.reform || meta.policyIds.baseline;
    return fetchHouseholdCalculation(
      meta.countryId,
      meta.populationId,
      policyId
    );
  } else {
    const params: EconomyCalculationParams = {};
    if (meta.region) {
      params.region = meta.region;
    }

    return fetchEconomyCalculation(
      meta.countryId,
      meta.policyIds.reform || meta.policyIds.baseline,
      meta.policyIds.baseline,
      params
    );
  }
}
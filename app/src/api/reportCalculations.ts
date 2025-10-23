import { CURRENT_YEAR } from '@/constants';
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
}

/**
 * Fetch calculation for a report using metadata
 */
export async function fetchCalculationWithMeta(meta: CalculationMeta) {
  console.log('[fetchCalculationWithMeta] Called with meta:', JSON.stringify(meta, null, 2));

  if (meta.type === 'household') {
    console.log('[fetchCalculationWithMeta] Type is household');
    const policyId = meta.policyIds.reform || meta.policyIds.baseline;
    console.log('[fetchCalculationWithMeta] Household calculation params:');
    console.log('  - countryId:', meta.countryId);
    console.log('  - populationId:', meta.populationId);
    console.log('  - policyId:', policyId);

    try {
      const result = await fetchHouseholdCalculation(meta.countryId, meta.populationId, policyId);
      console.log('[fetchCalculationWithMeta] Household calculation result:', result);
      return result;
    } catch (error) {
      console.error('[fetchCalculationWithMeta] Household calculation failed:', error);
      throw error;
    }
  } else {
    console.log('[fetchCalculationWithMeta] Type is economy');
    // TODO: Update to use dynamic time_period when available in UI
    console.log(
      `[fetchCalculationWithMeta] Temporarily using ${CURRENT_YEAR} as time_period for economy calculation`
    );
    const params: SocietyWideCalculationParams = {
      region: meta.region || meta.countryId,
      time_period: CURRENT_YEAR,
    };

    console.log('[fetchCalculationWithMeta] Society-wide calculation params:');
    console.log('  - countryId:', meta.countryId);
    console.log('  - reformPolicyId:', meta.policyIds.reform || meta.policyIds.baseline);
    console.log('  - baselinePolicyId:', meta.policyIds.baseline);
    console.log('  - params:', JSON.stringify(params, null, 2));

    try {
      const result = await fetchSocietyWideCalculation(
        meta.countryId,
        meta.policyIds.reform || meta.policyIds.baseline,
        meta.policyIds.baseline,
        params
      );
      console.log('[fetchCalculationWithMeta] Society-wide calculation result:');
      console.log('  - status:', result?.status);
      console.log('  - has result?', !!result?.result);
      console.log('  - queue_position:', result?.queue_position);
      console.log('  - average_time:', result?.average_time);
      console.log('  - error:', result?.error);
      console.log('  - full result:', result);
      return result;
    } catch (error) {
      console.error('[fetchCalculationWithMeta] Society-wide calculation failed:', error);
      throw error;
    }
  }
}

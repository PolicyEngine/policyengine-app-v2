import { useEffect } from 'react';
import {
  hasConstituencyImpacts,
  hasLocalAuthorityImpacts,
} from '@/adapters/societyWideOutputNormalizer';
import { outputServesLocalAreaBreakdowns } from '@/adapters/ukLocalAreaBreakdownAdapter';
import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import { useUKLocalAreaBreakdown } from '@/hooks/useUKLocalAreaBreakdown';

/**
 * Starts a UK report's local-area breakdown in the background, so the maps
 * are ready, or on their way, when the Local areas tab opens. A report
 * whose national results are still calculating starts it at once,
 * alongside that run. A report whose results are in starts it when they
 * lack a level and come from a release that serves breakdowns (.py 6.10.0
 * on); one that holds both levels, or an older release's, starts nothing.
 * It draws nothing: the tab follows the same run through the breakdown's
 * query key, with its progress, error and Retry. A run that failed is not
 * started again here.
 */
export default function UKLocalAreaAutoStart({
  output,
  resultsRunning = false,
  region,
  year,
  reformPolicyId,
  baselinePolicyId,
}: {
  /** The national results; null while they calculate. */
  output: SocietyWideReportOutput | null;
  /** The report's national run is calculating now, not loading saved results. */
  resultsRunning?: boolean;
  /** The report's region: `uk` (or empty) or `country/*`. */
  region?: string;
  year: string;
  reformPolicyId?: string;
  baselinePolicyId?: string;
}) {
  const breakdown = useUKLocalAreaBreakdown({
    countryId: 'uk',
    reformPolicyId,
    baselinePolicyId,
    region,
    year,
  });
  const wanted = output
    ? outputServesLocalAreaBreakdowns(output) &&
      !(hasConstituencyImpacts(output) && hasLocalAuthorityImpacts(output))
    : resultsRunning;
  const { canStart, status, start } = breakdown;

  useEffect(() => {
    if (wanted && canStart && status === 'idle') {
      start();
    }
  }, [wanted, canStart, status, start]);

  return null;
}

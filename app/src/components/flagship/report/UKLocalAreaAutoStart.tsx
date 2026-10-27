import { useEffect } from 'react';
import {
  hasConstituencyImpacts,
  hasLocalAuthorityImpacts,
} from '@/adapters/societyWideOutputNormalizer';
import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import { useUKLocalAreaOutput } from '@/hooks/useUKLocalAreaOutput';

/**
 * Starts a UK report's local-area breakdown as soon as its national result
 * is in, so the maps are ready, or on their way, when the Local areas tab
 * opens. It draws nothing: the tab follows the same run through the
 * breakdown's query key, with its progress, error and Retry. A result that
 * already holds both levels, or one from a release before .py 6.10.0,
 * starts nothing, and a run that failed is not started again here.
 */
export default function UKLocalAreaAutoStart({
  output,
  region,
  year,
  reformPolicyId,
  baselinePolicyId,
}: {
  output: SocietyWideReportOutput;
  /** The report's region: `uk` (or empty) or `country/*`. */
  region?: string;
  year: string;
  reformPolicyId?: string;
  baselinePolicyId?: string;
}) {
  const { canCompute, breakdown } = useUKLocalAreaOutput(output, {
    reformPolicyId,
    baselinePolicyId,
    region,
    year,
  });
  const lacksALevel = !(hasConstituencyImpacts(output) && hasLocalAuthorityImpacts(output));
  const { status, start } = breakdown;

  useEffect(() => {
    if (canCompute && lacksALevel && status === 'idle') {
      start();
    }
  }, [canCompute, lacksALevel, status, start]);

  return null;
}

import { hasUKLocalAreaImpacts } from '@/adapters/societyWideOutputNormalizer';
import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import type { LocalAreaBreakdown } from '@/types/metadata/LocalAreaBreakdown';

/**
 * The result whose local-area impacts a UK report shows: its own when it
 * holds them (older saved results), else the result with a completed
 * breakdown's areas in their place. Null until there are areas to show.
 */
export function localAreaOutput(
  output: SocietyWideReportOutput,
  breakdown: LocalAreaBreakdown | null
): SocietyWideReportOutput | null {
  if (hasUKLocalAreaImpacts(output)) {
    return output;
  }
  if (!breakdown) {
    return null;
  }
  return {
    ...output,
    constituency_impact: breakdown.constituency_impact,
    local_authority_impact: breakdown.local_authority_impact,
  } as SocietyWideReportOutput;
}

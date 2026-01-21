import { scrubUserId, scrubUserIdArray } from '@/utils/scrubUserId';
import type { ReportErrorContext, ScrubbedReportErrorContext } from './types';

/**
 * Derives a scrubbed version of the report error context
 * with all userId fields replaced with "[scrubbed]"
 */
export function deriveScrubbedContext(
  context: ReportErrorContext | undefined
): ScrubbedReportErrorContext | null {
  if (!context) {
    return null;
  }

  return {
    userReport: context.userReport ? scrubUserId(context.userReport) : null,
    userSimulations: scrubUserIdArray(context.userSimulations),
    userPolicies: scrubUserIdArray(context.userPolicies),
    userHouseholds: scrubUserIdArray(context.userHouseholds),
    userGeographies: scrubUserIdArray(context.userGeographies),
    report: context.report,
    simulations: context.simulations,
    policies: context.policies,
    households: context.households,
    geographies: context.geographies,
  };
}

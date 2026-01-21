import type { ErrorInfo } from 'react';
import type { Geography } from '@/types/ingredients/Geography';
import type { Household } from '@/types/ingredients/Household';
import type { Policy } from '@/types/ingredients/Policy';
import type { Report } from '@/types/ingredients/Report';
import type { Simulation } from '@/types/ingredients/Simulation';
import type { UserPolicy } from '@/types/ingredients/UserPolicy';
import type {
  UserGeographyPopulation,
  UserHouseholdPopulation,
} from '@/types/ingredients/UserPopulation';
import type { UserReport } from '@/types/ingredients/UserReport';
import type { UserSimulation } from '@/types/ingredients/UserSimulation';

/**
 * Context data for the error fallback to display in dev mode
 */
export interface ReportErrorContext {
  // User associations (will be scrubbed of userId)
  userReport?: UserReport | null;
  userSimulations?: UserSimulation[] | null;
  userPolicies?: UserPolicy[] | null;
  userHouseholds?: UserHouseholdPopulation[] | null;
  userGeographies?: UserGeographyPopulation[] | null;

  // Base ingredients (if they were successfully fetched)
  report?: Report | null;
  simulations?: Simulation[] | null;
  policies?: Policy[] | null;
  households?: Household[] | null;
  geographies?: Geography[] | null;
}

/**
 * Scrubbed version of ReportErrorContext with userId fields replaced
 */
export interface ScrubbedReportErrorContext {
  userReport: UserReport | null;
  userSimulations: UserSimulation[] | null;
  userPolicies: UserPolicy[] | null;
  userHouseholds: UserHouseholdPopulation[] | null;
  userGeographies: UserGeographyPopulation[] | null;
  report: Report | null | undefined;
  simulations: Simulation[] | null | undefined;
  policies: Policy[] | null | undefined;
  households: Household[] | null | undefined;
  geographies: Geography[] | null | undefined;
}

export interface ReportErrorFallbackProps {
  error: Error;
  errorInfo: ErrorInfo | null;
  context?: ReportErrorContext;
}

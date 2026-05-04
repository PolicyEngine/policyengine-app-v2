import type { HouseholdCalculationOutput } from '@/types/calculation/household';
import type { Policy } from '@/types/ingredients/Policy';
import type { Simulation } from '@/types/ingredients/Simulation';
import type { UserPolicy } from '@/types/ingredients/UserPolicy';
import HouseholdOverview from './HouseholdOverview';

interface Props {
  baseline: HouseholdCalculationOutput;
  reform: HouseholdCalculationOutput | null;
  simulations: Simulation[];
  policies?: Policy[];
  userPolicies?: UserPolicy[];
  households?: HouseholdCalculationOutput[];
  view?: string;
}

/**
 * Sub-router for Household Comparative Analysis tab
 * Legacy alias for the old comparative-analysis view.
 * Household reports now render these analyses inline on the overview page.
 */
export function HouseholdComparativeAnalysisPage({
  baseline,
  reform,
  simulations,
  policies,
  userPolicies: _userPolicies,
  households: _households,
  view,
}: Props) {
  const outputs = reform ? [baseline, reform] : [baseline];

  return (
    <HouseholdOverview
      outputs={outputs}
      simulations={simulations}
      policies={policies}
      activeView={view}
    />
  );
}

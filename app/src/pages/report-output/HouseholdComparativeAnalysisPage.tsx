import type { ComponentType } from 'react';
import type { Household } from '@/types/ingredients/Household';
import type { Policy } from '@/types/ingredients/Policy';
import type { Simulation } from '@/types/ingredients/Simulation';
import type { UserPolicy } from '@/types/ingredients/UserPolicy';
import NotFoundSubPage from './NotFoundSubPage';

interface Props {
  baseline: Household;
  reform: Household | null;
  simulations: Simulation[];
  policies?: Policy[];
  userPolicies?: UserPolicy[];
  households?: Household[];
  view?: string;
}

interface ViewComponentProps {
  baseline: Household;
  reform: Household | null;
  simulations: Simulation[];
  policies?: Policy[];
  userPolicies?: UserPolicy[];
  households?: Household[];
}

/**
 * Map of view names to their corresponding components
 * Add new views here as they are implemented
 */
const VIEW_MAP: Record<string, ComponentType<ViewComponentProps>> = {
  // 'net-income': NetIncomeSubPage,  // TODO: Phase 2
  // 'earnings-variation': EarningsVariationSubPage,  // TODO: Phase 4
  // 'marginal-tax-rates': MarginalTaxRatesSubPage,  // TODO: Phase 5
};

/**
 * Sub-router for Household Comparative Analysis tab
 * Maps :view URL parameter to specific chart components
 * Follows the same pattern as society-wide ComparativeAnalysisPage for consistency
 */
export function HouseholdComparativeAnalysisPage({
  baseline,
  reform,
  simulations,
  policies,
  userPolicies,
  households,
  view,
}: Props) {
  // If no view specified, use default view
  const effectiveView = view || 'net-income';

  // Look up component in map
  const ViewComponent = VIEW_MAP[effectiveView];

  // If found, render it; otherwise show NotFound
  return ViewComponent ? (
    <ViewComponent
      baseline={baseline}
      reform={reform}
      simulations={simulations}
      policies={policies}
      userPolicies={userPolicies}
      households={households}
    />
  ) : (
    <NotFoundSubPage />
  );
}

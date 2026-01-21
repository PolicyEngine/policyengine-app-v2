import type { ComponentType } from 'react';
import type { SocietyWideReportOutput as SocietyWideOutput } from '@/api/societyWideCalculation';
import { CongressionalDistrictDataProvider } from '@/contexts/CongressionalDistrictDataContext';
import BudgetaryImpactByProgramSubPage from './budgetary-impact/BudgetaryImpactByProgramSubPage';
import BudgetaryImpactSubPage from './budgetary-impact/BudgetaryImpactSubPage';
import { AbsoluteChangeByDistrict } from './congressional-district/AbsoluteChangeByDistrict';
import { RelativeChangeByDistrict } from './congressional-district/RelativeChangeByDistrict';
import DistributionalImpactIncomeAverageSubPage from './distributional-impact/DistributionalImpactIncomeAverageSubPage';
import DistributionalImpactIncomeRelativeSubPage from './distributional-impact/DistributionalImpactIncomeRelativeSubPage';
import DistributionalImpactWealthAverageSubPage from './distributional-impact/DistributionalImpactWealthAverageSubPage';
import DistributionalImpactWealthRelativeSubPage from './distributional-impact/DistributionalImpactWealthRelativeSubPage';
import WinnersLosersIncomeDecileSubPage from './distributional-impact/WinnersLosersIncomeDecileSubPage';
import WinnersLosersWealthDecileSubPage from './distributional-impact/WinnersLosersWealthDecileSubPage';
import InequalityImpactSubPage from './inequality-impact/InequalityImpactSubPage';
import NotFoundSubPage from './NotFoundSubPage';
import DeepPovertyImpactByAgeSubPage from './poverty-impact/DeepPovertyImpactByAgeSubPage';
import DeepPovertyImpactByGenderSubPage from './poverty-impact/DeepPovertyImpactByGenderSubPage';
import PovertyImpactByAgeSubPage from './poverty-impact/PovertyImpactByAgeSubPage';
import PovertyImpactByGenderSubPage from './poverty-impact/PovertyImpactByGenderSubPage';
import PovertyImpactByRaceSubPage from './poverty-impact/PovertyImpactByRaceSubPage';

interface Props {
  output: SocietyWideOutput;
  view?: string;
  /** Reform policy ID for state-by-state congressional district fetching */
  reformPolicyId?: string;
  /** Baseline policy ID for state-by-state congressional district fetching */
  baselinePolicyId?: string;
  /** Year for calculations */
  year?: string;
}

interface ViewComponentProps {
  output: SocietyWideOutput;
}

/**
 * Map of view names to their corresponding components
 * Add new views here as they are implemented
 */
const VIEW_MAP: Record<string, ComponentType<ViewComponentProps>> = {
  'budgetary-impact-overall': BudgetaryImpactSubPage,
  'budgetary-impact-by-program': BudgetaryImpactByProgramSubPage,
  'distributional-impact-income-relative': DistributionalImpactIncomeRelativeSubPage,
  'distributional-impact-income-average': DistributionalImpactIncomeAverageSubPage,
  'distributional-impact-wealth-relative': DistributionalImpactWealthRelativeSubPage,
  'distributional-impact-wealth-average': DistributionalImpactWealthAverageSubPage,
  'winners-losers-income-decile': WinnersLosersIncomeDecileSubPage,
  'winners-losers-wealth-decile': WinnersLosersWealthDecileSubPage,
  'poverty-impact-age': PovertyImpactByAgeSubPage,
  'poverty-impact-gender': PovertyImpactByGenderSubPage,
  'poverty-impact-race': PovertyImpactByRaceSubPage,
  'deep-poverty-impact-age': DeepPovertyImpactByAgeSubPage,
  'deep-poverty-impact-gender': DeepPovertyImpactByGenderSubPage,
  'inequality-impact': InequalityImpactSubPage,
  'congressional-district-absolute': AbsoluteChangeByDistrict,
  'congressional-district-relative': RelativeChangeByDistrict,
};

/**
 * Sub-router for Comparative Analysis tab - maps :view URL parameter to specific chart components.
 * Acts as a mini-router to keep SocietyWideReportOutput clean as we add 20+ analysis charts.
 *
 * Wraps content with CongressionalDistrictDataProvider so district data is shared
 * between absolute and relative congressional district views.
 */
export function ComparativeAnalysisPage({
  output,
  view,
  reformPolicyId,
  baselinePolicyId,
  year,
}: Props) {
  // If no view specified, use default view
  const effectiveView = view || 'budgetary-impact-overall';

  // Look up component in map
  const ViewComponent = VIEW_MAP[effectiveView];

  // Render content
  const content = ViewComponent ? (
    <ViewComponent output={output} />
  ) : (
    <NotFoundSubPage />
  );

  // Wrap with CongressionalDistrictDataProvider if we have the required props
  // This ensures district data is shared between absolute and relative views
  if (reformPolicyId && baselinePolicyId && year) {
    return (
      <CongressionalDistrictDataProvider
        reformPolicyId={reformPolicyId}
        baselinePolicyId={baselinePolicyId}
        year={year}
      >
        {content}
      </CongressionalDistrictDataProvider>
    );
  }

  return content;
}

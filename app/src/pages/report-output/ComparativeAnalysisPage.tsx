import type { ComponentType } from 'react';
import type { SocietyWideReportOutput as SocietyWideOutput } from '@/api/societyWideCalculation';
import BudgetaryImpactByProgramSubPage from './budgetary-impact/BudgetaryImpactByProgramSubPage';
import BudgetaryImpactSubPage from './budgetary-impact/BudgetaryImpactSubPage';
import CliffImpactSubPage from './cliff-impact/CliffImpactSubPage';
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
  'cliff-impact': CliffImpactSubPage,
};

/**
 * Sub-router for Comparative Analysis tab - maps :view URL parameter to specific chart components.
 * Acts as a mini-router to keep SocietyWideReportOutput clean as we add 20+ analysis charts.
 */
export function ComparativeAnalysisPage({ output, view }: Props) {
  // If no view specified, use default view
  const effectiveView = view || 'budgetary-impact-overall';

  // Look up component in map
  const ViewComponent = VIEW_MAP[effectiveView];

  // If found, render it; otherwise show NotFound
  return ViewComponent ? <ViewComponent output={output} /> : <NotFoundSubPage />;
}

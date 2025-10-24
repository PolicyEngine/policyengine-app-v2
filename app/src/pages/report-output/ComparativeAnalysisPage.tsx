import type { ComponentType } from 'react';
import type { SocietyWideReportOutput as SocietyWideOutput } from '@/api/societyWideCalculation';
import BudgetaryImpactByProgramSubPage from './budgetary-impact/BudgetaryImpactByProgramSubPage';
import BudgetaryImpactSubPage from './budgetary-impact/BudgetaryImpactSubPage';
import DistributionalImpactIncomeAverageSubPage from './distributional-impact/DistributionalImpactIncomeAverageSubPage';
import DistributionalImpactIncomeRelativeSubPage from './distributional-impact/DistributionalImpactIncomeRelativeSubPage';
import NotFoundSubPage from './NotFoundSubPage';

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
  // Add more as implemented:
  // 'winners-losers-income-decile': WinnersLosersIncomeDecileSubPage,
  // 'distributional-impact-wealth-relative': DistributionalImpactWealthRelativeSubPage,
  // 'distributional-impact-wealth-average': DistributionalImpactWealthAverageSubPage,
  // 'winners-losers-wealth-decile': WinnersLosersWealthDecileSubPage,
  // etc.
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

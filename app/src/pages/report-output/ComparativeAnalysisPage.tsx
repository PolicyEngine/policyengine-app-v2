import type { ComponentType } from 'react';
import type { SocietyWideReportOutput as SocietyWideOutput } from '@/api/societyWideCalculation';
import BudgetaryImpactByProgramSubPage from './budgetary-impact/BudgetaryImpactByProgramSubPage';
import BudgetaryImpactSubPage from './budgetary-impact/BudgetaryImpactSubPage';
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
  // Add more as implemented:
  // 'distributional-impact-income-relative': DistributionalImpactIncomeRelativeSubPage,
  // 'distributional-impact-income-average': DistributionalImpactIncomeAverageSubPage,
  // 'winners-losers-income-decile': WinnersLosersIncomeDecileSubPage,
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

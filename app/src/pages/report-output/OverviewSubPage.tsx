import { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import type { HouseholdCalculationOutput } from '@/types/calculation/household';
import type { Policy } from '@/types/ingredients/Policy';
import type { Simulation } from '@/types/ingredients/Simulation';
import { ReportOutputType } from '../ReportOutput.page';
import HouseholdOverview from './HouseholdOverview';
import SocietyWideOverview from './SocietyWideOverview';

interface OverviewSubPageProps {
  output: SocietyWideReportOutput | HouseholdCalculationOutput | HouseholdCalculationOutput[];
  outputType: ReportOutputType;
  policyLabels?: string[];
  simulations?: Simulation[];
  policies?: Policy[];
  activeView?: string;
}

/**
 * Overview sub-page - displays high-level summary of report results
 * Routes to the appropriate overview component based on output type
 */
export default function OverviewSubPage({
  output,
  outputType,
  policyLabels,
  simulations,
  policies,
  activeView,
}: OverviewSubPageProps) {
  if (outputType === 'societyWide') {
    return <SocietyWideOverview output={output as SocietyWideReportOutput} />;
  }

  // Household output can be single or array (for multiple simulations)
  const householdOutputs = Array.isArray(output) ? output : [output as HouseholdCalculationOutput];

  return (
    <HouseholdOverview
      outputs={householdOutputs}
      policyLabels={policyLabels}
      simulations={simulations}
      policies={policies}
      activeView={activeView}
    />
  );
}

import { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import { Household } from '@/types/ingredients/Household';
import { ReportOutputType } from '../ReportOutput.page';
import HouseholdOverview from './HouseholdOverview';
import SocietyWideOverview from './SocietyWideOverview';

interface OverviewSubPageProps {
  output: SocietyWideReportOutput | Household | Household[];
  outputType: ReportOutputType;
  policyLabels?: string[];
}

/**
 * Overview sub-page - displays high-level summary of report results
 * Routes to the appropriate overview component based on output type
 */
export default function OverviewSubPage({
  output,
  outputType,
  policyLabels,
}: OverviewSubPageProps) {
  if (outputType === 'societyWide') {
    return <SocietyWideOverview output={output as SocietyWideReportOutput} />;
  }

  // Household output can be single or array (for multiple simulations)
  const householdOutputs = Array.isArray(output) ? output : [output as Household];

  return <HouseholdOverview outputs={householdOutputs} policyLabels={policyLabels} />;
}

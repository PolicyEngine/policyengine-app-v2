import { EconomyReportOutput } from '@/api/economy';
import { Household } from '@/types/ingredients/Household';
import { ReportOutputType } from '../ReportOutput.page';
import EconomyOverview from './EconomyOverview';
import HouseholdOverview from './HouseholdOverview';

interface OverviewSubPageProps {
  output: EconomyReportOutput | Household | Household[];
  outputType: ReportOutputType;
}

/**
 * Overview sub-page - displays high-level summary of report results
 * Routes to the appropriate overview component based on output type
 */
export default function OverviewSubPage({ output, outputType }: OverviewSubPageProps) {
  if (outputType === 'economy') {
    return <EconomyOverview output={output as EconomyReportOutput} />;
  }

  // Household output can be single or array (for multiple simulations)
  const householdOutputs = Array.isArray(output) ? output : [output as Household];

  return <HouseholdOverview outputs={householdOutputs} />;
}

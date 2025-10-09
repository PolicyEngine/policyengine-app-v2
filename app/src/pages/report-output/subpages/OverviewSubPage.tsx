import { EconomyReportOutput } from '@/api/economy';
import { ReportOutputType } from '@/pages/ReportOutput.page';
import { Household } from '@/types/ingredients/Household';
import EconomyOverview from './EconomyOverview';
import HouseholdOverview from './HouseholdOverview';

interface OverviewSubPageProps {
  output: EconomyReportOutput | Household;
  outputType: ReportOutputType;
  baseline: Household | null;
  reform: Household | null;
}

/**
 * Overview sub-page - displays high-level summary of report results
 * Routes to the appropriate overview component based on output type
 */
export default function OverviewSubPage({
  output,
  outputType,
  baseline,
  reform,
}: OverviewSubPageProps) {
  if (outputType === 'economy') {
    return <EconomyOverview output={output as EconomyReportOutput} />;
  }

  // For household, pass baseline and reform for comparison
  return <HouseholdOverview baseline={baseline} reform={reform} />;
}

import { EconomyReportOutput } from '@/api/economy';
import { ReportOutputType } from '@/hooks/useReportData';
import { Household } from '@/types/ingredients/Household';
import EconomyOverview from './EconomyOverview';
import HouseholdOverview from './HouseholdOverview';

interface OverviewSubPageProps {
  output: EconomyReportOutput | Household;
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

  return <HouseholdOverview output={output as Household} />;
}

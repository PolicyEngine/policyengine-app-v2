import { useState } from 'react';
import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import DeepPovertyImpactByAgeSubPage from '@/components/flagship/report/charts/DeepPovertyImpactByAgeSubPage';
import DeepPovertyImpactByGenderSubPage from '@/components/flagship/report/charts/DeepPovertyImpactByGenderSubPage';
import DistributionalImpactIncomeAverageSubPage from '@/components/flagship/report/charts/DistributionalImpactIncomeAverageSubPage';
import DistributionalImpactIncomeRelativeSubPage from '@/components/flagship/report/charts/DistributionalImpactIncomeRelativeSubPage';
import InequalityImpactSubPage from '@/components/flagship/report/charts/InequalityImpactSubPage';
import PovertyImpactByAgeSubPage from '@/components/flagship/report/charts/PovertyImpactByAgeSubPage';
import PovertyImpactByGenderSubPage from '@/components/flagship/report/charts/PovertyImpactByGenderSubPage';
import PovertyImpactByRaceSubPage from '@/components/flagship/report/charts/PovertyImpactByRaceSubPage';
import WinnersLosersIncomeDecileSubPage from '@/components/flagship/report/charts/WinnersLosersIncomeDecileSubPage';
import ReportChartCard from '@/components/flagship/report/ReportChartCard';
import { SegmentedControl, Stack } from '@/components/ui';
import { spacing } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useReportYear } from '@/hooks/useReportYear';
import BudgetaryImpactSubPage from '@/pages/report-output/budgetary-impact/BudgetaryImpactSubPage';
import { getBudgetCsvRows } from '@/pages/report-output/budgetary-impact/budgetChartUtils';
import {
  getDecileAverageCsvRows,
  getDecileRelativeCsvRows,
  getWinnersLosersCsvRows,
} from '@/pages/report-output/distributional-impact/distributionalChartUtils';
import { getInequalityCsvRows } from '@/pages/report-output/inequality-impact/inequalityChartUtils';
import NoOpReportCallout from '@/pages/report-output/NoOpReportCallout';
import {
  getPovertyByAgeCsvRows,
  getPovertyByGenderCsvRows,
  getPovertyByRaceCsvRows,
} from '@/pages/report-output/poverty-impact/povertyChartUtils';
import { isSocietyWideReportNoOp } from '@/utils/isSocietyWideReportNoOp';

type PovertyDepth = 'regular' | 'deep';
type PovertyBreakdown = 'by-age' | 'by-gender' | 'by-race';

const POVERTY_DEPTH_OPTIONS = [
  { label: 'Regular poverty', value: 'regular' as PovertyDepth },
  { label: 'Deep poverty', value: 'deep' as PovertyDepth },
];

function getBreakdownOptions(
  depth: PovertyDepth,
  countryId: string
): Array<{ label: string; value: PovertyBreakdown; disabled?: boolean }> {
  const options: Array<{ label: string; value: PovertyBreakdown; disabled?: boolean }> = [
    { label: 'By age', value: 'by-age' },
    { label: 'By gender', value: 'by-gender' },
  ];
  if (countryId === 'us') {
    options.push({
      label: 'By race',
      value: 'by-race',
      disabled: depth === 'deep',
    });
  }
  return options;
}

type DecileMode = 'absolute' | 'relative';
const DECILE_MODE_OPTIONS = [
  { label: 'Absolute', value: 'absolute' as DecileMode },
  { label: 'Relative', value: 'relative' as DecileMode },
];

/**
 * Economic impact charts for the flagship report: an always-open grid of
 * chart cards, each expandable into a full-detail dialog.
 */
export default function EconomicImpactCharts({ output }: { output: SocietyWideReportOutput }) {
  const countryId = useCurrentCountry();
  const reportYear = useReportYear();
  const isNoOp = isSocietyWideReportNoOp(output);
  const [decileMode, setDecileMode] = useState<DecileMode>('absolute');
  const [povertyDepth, setPovertyDepth] = useState<PovertyDepth>('regular');
  const [povertyBreakdown, setPovertyBreakdown] = useState<PovertyBreakdown>('by-age');
  const breakdownOptions = getBreakdownOptions(povertyDepth, countryId);

  const handleDepthChange = (value: string) => {
    const newDepth = value as PovertyDepth;
    setPovertyDepth(newDepth);
    const options = getBreakdownOptions(newDepth, countryId);
    const currentOption = options.find((o) => o.value === povertyBreakdown);
    if (!currentOption || currentOption.disabled) {
      setPovertyBreakdown(options[0].value);
    }
  };

  const povertyChart = (compact: boolean) => {
    if (povertyDepth === 'regular') {
      if (povertyBreakdown === 'by-age') {
        return <PovertyImpactByAgeSubPage output={output} compact={compact} fillHeight />;
      }
      if (povertyBreakdown === 'by-gender') {
        return <PovertyImpactByGenderSubPage output={output} compact={compact} fillHeight />;
      }
      return <PovertyImpactByRaceSubPage output={output} compact={compact} fillHeight />;
    }
    if (povertyBreakdown === 'by-age') {
      return <DeepPovertyImpactByAgeSubPage output={output} compact={compact} fillHeight />;
    }
    return <DeepPovertyImpactByGenderSubPage output={output} compact={compact} fillHeight />;
  };

  const povertyDownloadFilename = `${povertyDepth === 'deep' ? 'deep-' : ''}poverty-impact-${povertyBreakdown}.svg`;
  const povertyCsvData = (() => {
    const variable = povertyDepth === 'deep' ? 'deep_poverty' : undefined;
    if (povertyBreakdown === 'by-age') {
      return getPovertyByAgeCsvRows(output, variable);
    }
    if (povertyBreakdown === 'by-gender') {
      return getPovertyByGenderCsvRows(output, variable);
    }
    return povertyDepth === 'regular' ? getPovertyByRaceCsvRows(output) : undefined;
  })();

  const decileChart = (compact: boolean) =>
    decileMode === 'absolute' ? (
      <DistributionalImpactIncomeAverageSubPage output={output} compact={compact} fillHeight />
    ) : (
      <DistributionalImpactIncomeRelativeSubPage output={output} compact={compact} fillHeight />
    );
  const decileFilename =
    decileMode === 'absolute'
      ? 'distributional-impact-income-average'
      : 'distributional-impact-income-relative';

  return (
    <Stack gap="lg">
      {isNoOp && <NoOpReportCallout year={reportYear} />}

      <div
        style={{
          display: 'grid',
          // Each group has two charts; prevent empty extra columns on wide screens.
          gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, max(370px, calc((100% - ${spacing.lg}) / 2))), 1fr))`,
          gap: spacing.lg,
        }}
      >
        <ReportChartCard
          title="Budgetary impact"
          fullWidth
          downloadFilename="budgetary-impact.svg"
          csvFilename="budgetary-impact.csv"
          csvData={getBudgetCsvRows(output, countryId)}
        >
          <BudgetaryImpactSubPage output={output} fillHeight />
        </ReportChartCard>

        <ReportChartCard
          title="Income change by decile"
          focusedContent={decileChart(false)}
          controls={
            <SegmentedControl
              value={decileMode}
              onValueChange={(value) => setDecileMode(value as DecileMode)}
              size="xs"
              options={DECILE_MODE_OPTIONS}
            />
          }
          downloadFilename={`${decileFilename}.svg`}
          csvFilename={`${decileFilename}.csv`}
          csvData={
            decileMode === 'absolute'
              ? getDecileAverageCsvRows(output)
              : getDecileRelativeCsvRows(output)
          }
        >
          {decileChart(true)}
        </ReportChartCard>

        <ReportChartCard
          title="Winners and losers"
          focusedChartHeight={340}
          focusedContent={<WinnersLosersIncomeDecileSubPage output={output} fillHeight />}
          downloadFilename="winners-losers-income-decile.svg"
          csvFilename="winners-losers-income-decile.csv"
          csvData={getWinnersLosersCsvRows(output)}
        >
          <WinnersLosersIncomeDecileSubPage output={output} compact fillHeight />
        </ReportChartCard>

        <ReportChartCard
          title="Poverty impact"
          focusedContent={povertyChart(false)}
          controls={
            <>
              <SegmentedControl
                value={povertyDepth}
                onValueChange={handleDepthChange}
                size="xs"
                options={POVERTY_DEPTH_OPTIONS}
              />
              <SegmentedControl
                value={povertyBreakdown}
                onValueChange={(value) => setPovertyBreakdown(value as PovertyBreakdown)}
                size="xs"
                options={breakdownOptions}
              />
            </>
          }
          downloadFilename={povertyDownloadFilename}
          csvFilename={povertyDownloadFilename.replace(/\.svg$/, '.csv')}
          csvData={povertyCsvData}
        >
          {povertyChart(true)}
        </ReportChartCard>

        <ReportChartCard
          title="Inequality impact"
          focusedContent={<InequalityImpactSubPage output={output} trimAxisZeros fillHeight />}
          downloadFilename="inequality-impact.svg"
          csvFilename="inequality-impact.csv"
          csvData={getInequalityCsvRows(output)}
        >
          <InequalityImpactSubPage output={output} compact trimAxisZeros fillHeight />
        </ReportChartCard>
      </div>
    </Stack>
  );
}

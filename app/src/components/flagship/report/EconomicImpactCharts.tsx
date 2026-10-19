import { useState } from 'react';
import { useSelector } from 'react-redux';
import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import BudgetaryImpactByProgramSubPage from '@/components/flagship/report/charts/BudgetaryImpactByProgramSubPage';
import BudgetaryImpactSubPage from '@/components/flagship/report/charts/BudgetaryImpactSubPage';
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
import {
  getBudgetCsvRows,
  getDetailedBudgetCsvRows,
} from '@/pages/report-output/budgetary-impact/budgetChartUtils';
import {
  getDecileAverageCsvRows,
  getDecileRelativeCsvRows,
  getWinnersLosersCsvRows,
} from '@/pages/report-output/distributional-impact/distributionalChartUtils';
import { getInequalityCsvRows } from '@/pages/report-output/inequality-impact/inequalityChartUtils';
import {
  getPovertyByAgeCsvRows,
  getPovertyByGenderCsvRows,
  getPovertyByRaceCsvRows,
} from '@/pages/report-output/poverty-impact/povertyChartUtils';
import type { RootState } from '@/store';

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
  const metadata = useSelector((state: RootState) => state.metadata);
  const [decileMode, setDecileMode] = useState<DecileMode>('absolute');
  const [wealthDecileMode, setWealthDecileMode] = useState<DecileMode>('absolute');
  // The UK's results also break the budget down by program and rank households by wealth.
  const isUK = countryId === 'uk';
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

  const wealthDecileChart = (compact: boolean) =>
    wealthDecileMode === 'absolute' ? (
      <DistributionalImpactIncomeAverageSubPage
        output={output}
        breakdown="wealth"
        compact={compact}
        fillHeight
      />
    ) : (
      <DistributionalImpactIncomeRelativeSubPage
        output={output}
        breakdown="wealth"
        compact={compact}
        fillHeight
      />
    );
  const wealthDecileFilename =
    wealthDecileMode === 'absolute'
      ? 'distributional-impact-wealth-average'
      : 'distributional-impact-wealth-relative';

  return (
    <Stack gap="lg">
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

        {isUK && (
          <ReportChartCard
            title="Budgetary impact by program"
            fullWidth
            downloadFilename="budgetary-impact-by-program.svg"
            csvFilename="budgetary-impact-by-program.csv"
            csvData={getDetailedBudgetCsvRows(output, metadata)}
          >
            <BudgetaryImpactByProgramSubPage output={output} fillHeight />
          </ReportChartCard>
        )}

        <ReportChartCard
          title="Income change by decile"
          focusedContent={decileChart(false)}
          controls={
            <SegmentedControl
              animated
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
          {/* A new mode fades in rather than snapping. */}
          <div key={decileMode} className="tw:h-full tw:motion-safe:fade-in-soft">
            {decileChart(true)}
          </div>
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
                animated
                value={povertyDepth}
                onValueChange={handleDepthChange}
                size="xs"
                options={POVERTY_DEPTH_OPTIONS}
              />
              <SegmentedControl
                animated
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
          <div
            key={`${povertyDepth}-${povertyBreakdown}`}
            className="tw:h-full tw:motion-safe:fade-in-soft"
          >
            {povertyChart(true)}
          </div>
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

        {isUK && (
          <ReportChartCard
            title="Income change by wealth decile"
            focusedContent={wealthDecileChart(false)}
            controls={
              <SegmentedControl
                animated
                value={wealthDecileMode}
                onValueChange={(value) => setWealthDecileMode(value as DecileMode)}
                size="xs"
                options={DECILE_MODE_OPTIONS}
              />
            }
            downloadFilename={`${wealthDecileFilename}.svg`}
            csvFilename={`${wealthDecileFilename}.csv`}
            csvData={
              wealthDecileMode === 'absolute'
                ? getDecileAverageCsvRows(output, 'wealth')
                : getDecileRelativeCsvRows(output, 'wealth')
            }
          >
            <div key={wealthDecileMode} className="tw:h-full tw:motion-safe:fade-in-soft">
              {wealthDecileChart(true)}
            </div>
          </ReportChartCard>
        )}

        {isUK && (
          <ReportChartCard
            title="Winners and losers by wealth decile"
            focusedChartHeight={340}
            focusedContent={
              <WinnersLosersIncomeDecileSubPage output={output} breakdown="wealth" fillHeight />
            }
            downloadFilename="winners-losers-wealth-decile.svg"
            csvFilename="winners-losers-wealth-decile.csv"
            csvData={getWinnersLosersCsvRows(output, 'wealth')}
          >
            <WinnersLosersIncomeDecileSubPage
              output={output}
              breakdown="wealth"
              compact
              fillHeight
            />
          </ReportChartCard>
        )}
      </div>
    </Stack>
  );
}

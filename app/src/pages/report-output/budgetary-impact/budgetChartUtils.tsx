/**
 * Shared utilities for the budgetary impact waterfall charts.
 */

import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import { TOOLTIP_STYLE, type WaterfallDatum } from '@/components/charts';
import { colors } from '@/designTokens/colors';
import { typography } from '@/designTokens/typography';
import type { CountryId } from '@/libs/countries';
import type { MetadataState } from '@/types/metadata';
import type { CsvData } from '@/utils/chartUtils';
import { formatCurrencyAbbr } from '@/utils/formatters';
import { regionName } from '@/utils/impactChartUtils';

interface ProgramBudgetItem {
  baseline: number;
  difference: number;
  reform: number;
}

/** Tooltip for budget waterfall charts - shows name and hover text */
export function BudgetWaterfallTooltip({ active, payload }: any) {
  if (!active || !payload?.[0]) {
    return null;
  }
  const data = payload[0].payload as WaterfallDatum & { hoverText: string };
  return (
    <div style={{ ...TOOLTIP_STYLE, maxWidth: 300 }}>
      <p style={{ fontWeight: typography.fontWeight.semibold, margin: 0 }}>{data.name}</p>
      <p style={{ margin: '4px 0 0', fontSize: typography.fontSize.sm, whiteSpace: 'pre-wrap' }}>
        {data.hoverText}
      </p>
    </div>
  );
}

/** Returns fill color for a waterfall bar based on its value and the overall budget impact. */
export function getBudgetFillColor(datum: WaterfallDatum, budgetaryImpact: number): string {
  if (datum.isTotal) {
    return budgetaryImpact < 0 ? colors.gray[600] : colors.primary[700];
  }
  return datum.value >= 0 ? colors.primary[500] : colors.gray[600];
}

/** Generates the chart title describing the reform's budget impact. */
export function getBudgetChartTitle(
  budgetaryImpact: number,
  countryId: CountryId,
  metadata: MetadataState
): string {
  const region = regionName(metadata);
  const regionPhrase = region ? ` in ${region}` : '';

  if (budgetaryImpact === 0) {
    return `This reform would have no effect on the budget${regionPhrase}`;
  }

  const formattedAmount = formatCurrencyAbbr(Math.abs(budgetaryImpact), countryId, {
    maximumFractionDigits: 1,
  });
  const verb = budgetaryImpact > 0 ? 'raise' : 'cost';
  return `This reform would ${verb} ${formattedAmount}${regionPhrase}`;
}

/** Formats a value in billions using the country's currency abbreviation. */
export function formatBillions(value: number, countryId: CountryId): string {
  return formatCurrencyAbbr(value, countryId, { maximumFractionDigits: 1 });
}

export function getBudgetCsvRows(output: SocietyWideReportOutput, countryId: CountryId): CsvData {
  const budgetaryImpact = output.budget.budgetary_impact;
  const spendingImpact = output.budget.benefit_spending_impact;
  const stateTaxImpact = output.budget.state_tax_revenue_impact;
  const taxImpact = output.budget.tax_revenue_impact - stateTaxImpact;
  const labelsBeforeFilter =
    countryId === 'us'
      ? [
          'Federal tax revenues',
          'State and local income tax revenues',
          'Benefit spending',
          'Net impact',
        ]
      : ['Tax revenues', 'State and local income tax revenues', 'Benefit spending', 'Net impact'];
  const valuesBeforeFilter = [
    taxImpact / 1e9,
    stateTaxImpact / 1e9,
    -spendingImpact / 1e9,
    budgetaryImpact / 1e9,
  ];
  const rows = labelsBeforeFilter
    .map((label, index) => [label, valuesBeforeFilter[index]])
    .filter(([, value]) => value !== 0);

  return [['Category', 'Budgetary impact (billions)'], ...rows];
}

function isProgramBudgetItem(value: unknown): value is ProgramBudgetItem {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const item = value as Partial<ProgramBudgetItem>;
  return (
    typeof item.baseline === 'number' &&
    typeof item.reform === 'number' &&
    typeof item.difference === 'number'
  );
}

export function getDetailedBudgetCsvRows(
  output: SocietyWideReportOutput,
  metadata: MetadataState
): CsvData {
  const rows = Object.entries(output.detailed_budget ?? {})
    .filter(([, values]) => isProgramBudgetItem(values))
    .map(([program, values]) => {
      const programValues = values as ProgramBudgetItem;
      return [
        metadata.variables[program]?.label ?? program,
        programValues.baseline,
        programValues.reform,
        programValues.difference,
      ];
    });

  return [['Program', 'Baseline', 'Reform', 'Difference'], ...rows];
}

/**
 * Creates a Y-axis tick formatter that adapts decimal precision to the data range.
 * For narrow ranges (< 1bn) uses 2 decimals; otherwise uses 1 decimal.
 * Avoids "-$0.0" by treating near-zero values as 0.
 */
export function makeBudgetTickFormatter(
  symbol: string,
  yDomain: [number, number]
): (v: number) => string {
  const range = yDomain[1] - yDomain[0];
  const decimals = range < 1 ? 2 : 1;
  return (v: number) => {
    const display = Math.abs(v) < 1e-10 ? 0 : v;
    return `${symbol}${display.toFixed(decimals)}`;
  };
}

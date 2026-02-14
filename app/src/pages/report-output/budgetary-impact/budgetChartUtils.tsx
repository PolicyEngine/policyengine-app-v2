/**
 * Shared utilities for the budgetary impact waterfall charts.
 */

import { TOOLTIP_STYLE, type WaterfallDatum } from '@/components/charts';
import { colors } from '@/designTokens/colors';
import { formatCurrencyAbbr } from '@/utils/formatters';
import { regionName } from '@/utils/impactChartUtils';

/** Tooltip for budget waterfall charts - shows name and hover text */
export function BudgetWaterfallTooltip({ active, payload }: any) {
  if (!active || !payload?.[0]) {
    return null;
  }
  const data = payload[0].payload as WaterfallDatum & { hoverText: string };
  return (
    <div style={{ ...TOOLTIP_STYLE, maxWidth: 300 }}>
      <p style={{ fontWeight: 600, margin: 0 }}>{data.name}</p>
      <p style={{ margin: '4px 0 0', fontSize: 13, whiteSpace: 'pre-wrap' }}>{data.hoverText}</p>
    </div>
  );
}

/** Returns fill color for a waterfall bar based on its value and the overall budget impact. */
export function getBudgetFillColor(datum: WaterfallDatum, budgetaryImpact: number): string {
  if (datum.isTotal) {
    return budgetaryImpact < 0 ? colors.gray[600] : colors.primary[500];
  }
  return datum.value >= 0 ? colors.primary[500] : colors.gray[600];
}

/** Generates the chart title describing the reform's budget impact. */
export function getBudgetChartTitle(
  budgetaryImpact: number,
  countryId: string,
  metadata: { variables?: Record<string, any>; [key: string]: any }
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
export function formatBillions(value: number, countryId: string): string {
  return formatCurrencyAbbr(value, countryId, { maximumFractionDigits: 1 });
}

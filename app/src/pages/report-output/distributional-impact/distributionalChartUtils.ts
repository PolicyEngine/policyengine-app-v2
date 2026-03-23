/**
 * Shared utilities for distributional impact chart titles and CSV exports.
 */

import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import type { CountryId } from '@/libs/countries';
import type { MetadataState } from '@/types/metadata';
import { formatCurrency, formatPercent } from '@/utils/formatters';
import { regionName } from '@/utils/impactChartUtils';

export function getDistributionalAverageTitle(
  output: SocietyWideReportOutput,
  countryId: CountryId,
  metadata: MetadataState
): string {
  const averageChange = -output.budget.budgetary_impact / output.budget.households;
  const term1 = 'the net income of households';
  const term2 = formatCurrency(Math.abs(averageChange), countryId, {
    maximumFractionDigits: 0,
  });
  const signTerm = averageChange > 0 ? 'increase' : 'decrease';

  const region = regionName(metadata);
  const regionPhrase = region ? ` in ${region}` : '';

  if (averageChange === 0) {
    return `This reform would have no effect on ${term1}${regionPhrase} on average`;
  }
  return `This reform would ${signTerm} ${term1} by ${term2}${regionPhrase} on average`;
}

export function getDistributionalRelativeTitle(
  output: SocietyWideReportOutput,
  countryId: CountryId,
  metadata: MetadataState
): string {
  const relativeChange = -output.budget.budgetary_impact / output.budget.baseline_net_income;
  const term1 = 'the net income of households';
  const term2 = formatPercent(Math.abs(relativeChange), countryId, {
    maximumFractionDigits: 1,
  });
  const signTerm = relativeChange > 0 ? 'increase' : 'decrease';

  const region = regionName(metadata);
  const regionPhrase = region ? ` in ${region}` : '';

  if (relativeChange === 0) {
    return `This reform would have no effect on ${term1}${regionPhrase} on average`;
  }
  return `This reform would ${signTerm} ${term1} by ${term2}${regionPhrase} on average`;
}

export function getWinnersLosersTitle(
  output: SocietyWideReportOutput,
  countryId: CountryId,
  metadata: MetadataState
): string {
  const all = output.intra_decile.all;
  const totalAhead = all['Gain more than 5%'] + all['Gain less than 5%'];
  const totalBehind = all['Lose more than 5%'] + all['Lose less than 5%'];
  const percent = (n: number) => formatPercent(n, countryId, { maximumFractionDigits: 0 });
  const totalAheadTerm = percent(totalAhead);
  const totalBehindTerm = percent(totalBehind);
  const objectTerm = 'the net income';
  const region = regionName(metadata);
  const regionPhrase = region ? ` in ${region}` : '';

  if (totalAhead > 0 && totalBehind > 0) {
    return `This reform would increase ${objectTerm} for ${totalAheadTerm} of the population${regionPhrase} and decrease it for ${totalBehindTerm}`;
  }
  if (totalAhead > 0) {
    return `This reform would increase ${objectTerm} for ${totalAheadTerm} of the population${regionPhrase}`;
  }
  if (totalBehind > 0) {
    return `This reform would decrease ${objectTerm} for ${totalBehindTerm} of the population${regionPhrase}`;
  }
  return `This reform would have no effect on ${objectTerm} for the population${regionPhrase}`;
}

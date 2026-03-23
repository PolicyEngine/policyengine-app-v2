/**
 * Shared utilities for poverty impact chart titles and CSV exports.
 */

import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import type { CountryId } from '@/libs/countries';
import type { MetadataState } from '@/types/metadata';
import { formatNumber, formatPercent } from '@/utils/formatters';
import { regionName } from '@/utils/impactChartUtils';

function povertyTitleFromData(
  baseline: number,
  reform: number,
  objectTerm: string,
  countryId: CountryId,
  metadata: MetadataState
): string {
  const relativeChange = reform / baseline - 1;
  const absoluteChange = Math.round(Math.abs(reform - baseline) * 1000) / 10;
  const relTerm = formatPercent(Math.abs(relativeChange), countryId, {
    maximumFractionDigits: 1,
  });
  const absTerm = formatNumber(absoluteChange, countryId, {
    maximumFractionDigits: 2,
  });
  const term2 = `${relTerm} (${absTerm}pp)`;
  const signTerm = relativeChange > 0 ? 'increase' : 'decrease';
  const region = regionName(metadata);
  const regionPhrase = region ? ` in ${region}` : '';

  if (absTerm === '0') {
    return `This reform would have no effect on ${objectTerm}${regionPhrase}`;
  }
  return `This reform would ${signTerm} ${objectTerm}${regionPhrase} by ${term2}`;
}

export function getPovertyTitle(
  output: SocietyWideReportOutput,
  countryId: CountryId,
  metadata: MetadataState
): string {
  const { baseline, reform } = output.poverty.poverty.all;
  return povertyTitleFromData(baseline, reform, 'the poverty rate', countryId, metadata);
}

export function getDeepPovertyTitle(
  output: SocietyWideReportOutput,
  countryId: CountryId,
  metadata: MetadataState
): string {
  const { baseline, reform } = output.poverty.deep_poverty.all;
  return povertyTitleFromData(baseline, reform, 'the deep poverty rate', countryId, metadata);
}

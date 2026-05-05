/**
 * Shared utilities for poverty impact chart titles and CSV exports.
 */

import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import type { CountryId } from '@/libs/countries';
import type { MetadataState } from '@/types/metadata';
import type { CsvCell, CsvData } from '@/utils/chartUtils';
import { formatNumber, formatPercent } from '@/utils/formatters';
import { regionName } from '@/utils/impactChartUtils';

type PovertyDepth = 'poverty' | 'deep_poverty';
type PovertyRate = { baseline: number; reform: number };

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

function relativeChange(rate?: PovertyRate): CsvCell {
  if (!rate || rate.baseline === 0) {
    return null;
  }
  return rate.reform / rate.baseline - 1;
}

function povertyRow(label: string, rate?: PovertyRate): CsvCell[] {
  return [label, rate?.baseline, rate?.reform, relativeChange(rate)];
}

export function getPovertyByAgeCsvRows(
  output: SocietyWideReportOutput,
  depth: PovertyDepth = 'poverty'
): CsvData {
  const impact = output.poverty[depth];
  return [
    ['Age group', 'Baseline', 'Reform', 'Change'],
    povertyRow('Children', impact.child),
    povertyRow('Working-age adults', impact.adult),
    povertyRow('Seniors', impact.senior),
    povertyRow('All', impact.all),
  ];
}

export function getPovertyByGenderCsvRows(
  output: SocietyWideReportOutput,
  depth: PovertyDepth = 'poverty'
): CsvData {
  const genderImpact = output.poverty_by_gender?.[depth];
  const allImpact = output.poverty[depth];
  return [
    ['Sex', 'Baseline', 'Reform', 'Change'],
    povertyRow('Male', genderImpact?.male),
    povertyRow('Female', genderImpact?.female),
    povertyRow('All', allImpact.all),
  ];
}

export function getPovertyByRaceCsvRows(output: SocietyWideReportOutput): CsvData {
  const raceImpact = output.poverty_by_race?.poverty;
  const allImpact = output.poverty.poverty;
  return [
    ['Race', 'Baseline', 'Reform', 'Change'],
    povertyRow('White (non-Hispanic)', raceImpact?.white),
    povertyRow('Black (non-Hispanic)', raceImpact?.black),
    povertyRow('Hispanic', raceImpact?.hispanic),
    povertyRow('Other', raceImpact?.other),
    povertyRow('All', allImpact.all),
  ];
}

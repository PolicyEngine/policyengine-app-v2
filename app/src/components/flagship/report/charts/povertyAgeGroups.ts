import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';

type AgeKey = keyof SocietyWideReportOutput['poverty']['poverty'];

/**
 * The age groups policyengine.py reports poverty for, in both countries:
 * under 18, 18 to 64, and 65 and over. Each is named by its ages, not as
 * "working-age adults" or "seniors": in the UK, working age runs to State
 * Pension age (66 and rising), so people aged 65 are not pensioners.
 */
export const POVERTY_AGE_GROUPS: {
  key: AgeKey;
  label: string;
  /** What a bar's hover text calls the group's people. */
  people: string;
}[] = [
  { key: 'child', label: 'Children', people: 'children' },
  { key: 'adult', label: 'Adults 18 to 64', people: 'adults aged 18 to 64' },
  { key: 'senior', label: 'Adults 65 and over', people: 'adults aged 65 and over' },
  { key: 'all', label: 'All', people: 'people' },
];

/** The short name a compact card shows, and any chart where the full one does not fit. */
export const POVERTY_AGE_SHORT_NAMES: Record<string, string> = {
  'Adults 18 to 64': 'Ages 18–64',
  'Adults 65 and over': 'Ages 65+',
};

/** The groups' names, in their order, for the chart's CSV download. */
export const POVERTY_AGE_CSV_LABELS = Object.fromEntries(
  POVERTY_AGE_GROUPS.map(({ key, label }) => [key, label])
) as Record<AgeKey, string>;

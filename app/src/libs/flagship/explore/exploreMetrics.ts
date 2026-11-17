import type { BaselineMetricKey, RegionLevel } from './baselineData';

/** A link to a page that explains the metric's method. */
export interface MethodLink {
  label: string;
  href: string;
}

export interface ExploreMetric {
  key: BaselineMetricKey;
  /** The pill and legend label: "Poverty". */
  label: string;
  /** What the big number is, after it: "of people are in poverty (SPM)". */
  valueLabel: string;
  format: (value: number) => string;
  /** Whether the map offers it as a layer; the others show in the place card only. */
  onMap: boolean;
  /** Levels where few survey households stand behind each value, so the card adds a caution. */
  cautionAt: RegionLevel[];
  /** Search terms for programs that move the metric; each opens Build's search. */
  programs: string[];
  /** How we measure this. */
  definition: string;
  data: string;
  limits: string;
  links: MethodLink[];
}

const WEBSITE = 'https://www.policyengine.org';

const SPM_POST: MethodLink = {
  label: 'The Supplemental Poverty Measure in PolicyEngine',
  href: `${WEBSITE}/us/research/2025-supplemental-poverty-measure`,
};
const SPM_LEVELS_POST: MethodLink = {
  label: 'Why our poverty rates differ from Census',
  href: `${WEBSITE}/us/research/2025-spm-poverty-prediction`,
};
const DATA_PIPELINE: MethodLink = {
  label: 'Data and calibration',
  href: `${WEBSITE}/us/model/data/pipeline`,
};
const CALIBRATION_TARGETS: MethodLink = {
  label: 'Calibration targets and fit',
  href: 'https://calibration-diagnostics.vercel.app/calibration/dashboard/microcosm/targets',
};

const DATA_SENTENCE =
  'Microcosm US 2024 data: the Census CPS ASEC, with incomes imputed from IRS records, reweighted to administrative totals for the nation, each state and each congressional district, and projected to the year shown.';

const percent = (value: number) => `${(value * 100).toFixed(1)}%`;

const SPM_DATA = `${DATA_SENTENCE} SPM thresholds follow the Census Bureau, adjusted for local rents.`;
const SPM_LIMITS =
  'This is the Supplemental Poverty Measure, not the official poverty rate, which counts pre-tax cash income only; PolicyEngine does not compute the official rate. Surveys under-report benefits, so PolicyEngine computes benefits from the rules, and its rates can differ from Census figures. Poverty is not a calibration target.';

/** The page's metrics, in pill order. */
export const EXPLORE_METRICS: ExploreMetric[] = [
  {
    key: 'poverty',
    label: 'Poverty',
    valueLabel: 'of people are in poverty (SPM)',
    format: percent,
    onMap: true,
    cautionAt: ['district'],
    programs: ['Earned Income Tax Credit', 'SNAP', 'Child Tax Credit'],
    definition:
      'Share of people whose family resources, after taxes and benefits and less work and medical costs, are below the Supplemental Poverty Measure (SPM) threshold for their family and area.',
    data: SPM_DATA,
    limits: SPM_LIMITS,
    links: [SPM_POST, SPM_LEVELS_POST, DATA_PIPELINE],
  },
  {
    key: 'child_poverty',
    label: 'Child poverty',
    valueLabel: 'of children are in poverty (SPM)',
    format: percent,
    onMap: true,
    cautionAt: ['district'],
    programs: ['Child Tax Credit', 'SNAP', 'School meals'],
    definition: 'Share of people under 18 who live in a family below the SPM threshold.',
    data: SPM_DATA,
    limits: `${SPM_LIMITS} Children are a smaller group, so state and district values are less precise than the overall rate.`,
    links: [SPM_POST, SPM_LEVELS_POST, DATA_PIPELINE],
  },
  {
    key: 'median_household_net_income',
    label: 'Median household income',
    valueLabel: 'median household income after taxes and benefits',
    format: (value) => `$${Math.round(value / 100) / 10}k`,
    onMap: true,
    cautionAt: [],
    programs: ['Income tax rates', 'Standard deduction', 'State income tax'],
    definition: 'Income of the middle household after federal and state taxes and after benefits.',
    data: DATA_SENTENCE,
    limits:
      'Income after taxes and benefits, so it differs from the Census money-income median, which is before taxes. District incomes are calibrated to IRS adjusted gross income, a related but different concept.',
    links: [DATA_PIPELINE, CALIBRATION_TARGETS],
  },
  {
    key: 'gini',
    label: 'Inequality',
    valueLabel: 'Gini index of household income after taxes and benefits',
    format: (value) => value.toFixed(2),
    onMap: true,
    cautionAt: ['district'],
    programs: ['Top income tax rate', 'Earned Income Tax Credit', 'Child Tax Credit'],
    definition:
      'Gini index of household income after taxes and benefits: 0 means every household has the same income; 1 means one household has it all.',
    data: DATA_SENTENCE,
    limits:
      'Measured across households, not people, and not adjusted for household size. Surveys capture top incomes poorly; IRS data fills part of the gap.',
    links: [DATA_PIPELINE],
  },
  {
    key: 'deep_poverty',
    label: 'Deep poverty',
    valueLabel: 'of people have resources below half the SPM threshold',
    format: percent,
    onMap: false,
    cautionAt: ['state', 'district'],
    programs: ['SSI', 'TANF', 'SNAP'],
    definition: 'Share of people whose family resources are below half of their SPM threshold.',
    data: SPM_DATA,
    limits: `Few survey households are this far below the threshold, and survey income is least accurate here. ${SPM_LIMITS}`,
    links: [SPM_POST, SPM_LEVELS_POST],
  },
];

export const MAP_METRICS = EXPLORE_METRICS.filter((metric) => metric.onMap);

export const DEFAULT_METRIC = EXPLORE_METRICS[0];

export function exploreMetric(key: string | null | undefined): ExploreMetric {
  return EXPLORE_METRICS.find((metric) => metric.key === key) ?? DEFAULT_METRIC;
}

/** The note that a value rests on a thin sample, or null. */
export function cautionFor(metric: ExploreMetric, level: RegionLevel): string | null {
  if (!metric.cautionAt.includes(level)) {
    return null;
  }
  return level === 'district'
    ? 'District values rest on fewer survey households than state values, so read them as estimates with a wide margin.'
    : 'State values rest on few survey households for this measure, so read them as estimates with a wide margin.';
}

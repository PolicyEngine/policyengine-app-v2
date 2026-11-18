import type { BaselineMetricKey, CombineWeight, RecipientKey } from './baselineData';

/** The levels the page shows: the nation and the states. */
export type ShownLevel = 'nation' | 'state';

/** A link to a page that explains the metric's method. */
export interface MethodLink {
  label: string;
  href: string;
}

/** The pills: each holds a few measures, one shown on the map at a time. */
export type ExploreTheme = 'poverty' | 'income' | 'inequality' | 'taxes' | 'benefits';

export const THEMES: { key: ExploreTheme; label: string }[] = [
  { key: 'poverty', label: 'Poverty' },
  { key: 'income', label: 'Income' },
  { key: 'inequality', label: 'Inequality' },
  { key: 'taxes', label: 'Taxes' },
  { key: 'benefits', label: 'Benefits and credits' },
];

export interface ExploreMetric {
  key: BaselineMetricKey;
  theme: ExploreTheme;
  /** The selector, legend and card label: "Child poverty". */
  label: string;
  /** What the big number is, after it: "of children are in poverty (SPM)". */
  valueLabel: string;
  format: (value: number) => string;
  /** Benefit measures: the unit that receives it, and its recipients figure. */
  recipients?: { key: RecipientKey; unit: RecipientUnit };
  /** What a reader should know before they quote the value, in one sentence. */
  caveat?: string;
  /** Levels where the page shows no value yet, with the reason. Districts show none at all. */
  hiddenAt?: ShownLevel[];
  hiddenReason?: string;
  /**
   * The count that weights each state when the states are combined into
   * the figure a state is compared with. Without it, the page uses the
   * national file's value.
   */
  combine?: CombineWeight;
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
const thousands = (value: number) => `$${Math.round(value / 100) / 10}k`;
const dollars = (value: number) => `$${Math.round(value).toLocaleString('en-US')}`;

const SPM_DATA = `${DATA_SENTENCE} SPM thresholds follow the Census Bureau, adjusted for local rents.`;
const SPM_LIMITS =
  'This is the Supplemental Poverty Measure, not the official poverty rate, which counts pre-tax cash income only; PolicyEngine does not compute the official rate. Surveys under-report benefits, so PolicyEngine computes benefits from the rules, and its rates can differ from Census figures. Poverty is not a calibration target.';
const SPM_DEFINITION =
  'whose family resources, after taxes and benefits and less work and medical costs, are below the Supplemental Poverty Measure (SPM) threshold for their family and area.';
const RECEIPT_LIMITS =
  'PolicyEngine computes eligibility from the rules and imputes who takes a benefit up, calibrated to administrative totals for the nation and states. The agency count beside it can count a different unit or period, as its label says. Who receives a benefit in a given district is an estimate.';

/** 18,400,000 → "18.4M"; 950,000 → "950k". */
export function formatCount(value: number): string {
  if (value >= 1e6) {
    return `${(value / 1e6).toFixed(value >= 1e7 ? 1 : 2)}M`;
  }
  return value >= 1e3 ? `${Math.round(value / 1e3)}k` : `${Math.round(value)}`;
}

/** The unit a program pays: a person, a household or family (an SPM unit), or a tax unit. */
export type RecipientUnit = 'person' | 'school-age child' | 'household' | 'family' | 'tax unit';

/** "people", "households", "families", "tax units". */
export function unitPlural(unit: RecipientUnit): string {
  return {
    person: 'people',
    'school-age child': 'school-age children',
    household: 'households',
    family: 'families',
    'tax unit': 'tax units',
  }[unit];
}

const STATES_FAR_FROM_AGENCY = 'State counts are too far from the agency counts to show yet.';

const SPM_UNIT_NOTE =
  'A household or family here is an SPM unit: the people who live together and share food and housing costs.';

/**
 * A benefit's reach, counted in the unit the program pays: the share of
 * people, households (SPM units), families (SPM units) or tax units that
 * receive it.
 */
function receipt(
  key: BaselineMetricKey,
  recipientsKey: RecipientKey,
  label: string,
  unit: RecipientUnit,
  options: {
    /** More on who counts, added to the definition. */
    who?: string;
    caveat?: string;
    /** True where state counts are too far from the agencies' to show. */
    nationOnly?: boolean;
  } = {}
): ExploreMetric {
  const { who, caveat, nationOnly } = options;
  const verb = unit === 'tax unit' ? 'claim' : 'receive';
  const units = unitPlural(unit);
  return {
    key,
    theme: 'benefits',
    label,
    valueLabel: `of ${units} ${verb} ${label}`,
    format: percent,
    recipients: { key: recipientsKey, unit },
    combine:
      unit === 'tax unit'
        ? 'tax_units'
        : unit === 'household' || unit === 'family'
          ? 'spm_units'
          : 'people',
    ...(caveat ? { caveat } : {}),
    ...(nationOnly ? { hiddenAt: ['state' as const], hiddenReason: STATES_FAR_FROM_AGENCY } : {}),
    definition: `Share of ${units} that ${verb} ${label} in the year, as PolicyEngine computes it from the program's rules.${unit === 'household' || unit === 'family' ? ` ${SPM_UNIT_NOTE}` : ''}${who ? ` ${who}` : ''}`,
    data: DATA_SENTENCE,
    limits: RECEIPT_LIMITS,
    links: [DATA_PIPELINE, CALIBRATION_TARGETS],
  };
}

/** Every measure, grouped by theme; the first of each theme is its default. */
export const EXPLORE_METRICS: ExploreMetric[] = [
  {
    key: 'poverty',
    combine: 'people',
    caveat:
      "The Supplemental Poverty Measure. State rates differ from the Census Bureau's by about 2 points.",
    theme: 'poverty',
    label: 'All people',
    valueLabel: 'of people are in poverty (SPM)',
    format: percent,
    definition: `Share of people ${SPM_DEFINITION}`,
    data: SPM_DATA,
    limits: SPM_LIMITS,
    links: [SPM_POST, SPM_LEVELS_POST, DATA_PIPELINE],
  },
  {
    key: 'child_poverty',
    combine: 'people',
    caveat: "Higher than the Census Bureau's rate for children.",
    theme: 'poverty',
    label: 'Children',
    valueLabel: 'of children are in poverty (SPM)',
    format: percent,
    definition: `Share of people under 18 ${SPM_DEFINITION}`,
    data: SPM_DATA,
    limits: `${SPM_LIMITS} Children are a smaller group, so state and district values are less precise than the overall rate.`,
    links: [SPM_POST, SPM_LEVELS_POST, DATA_PIPELINE],
  },
  {
    key: 'senior_poverty',
    combine: 'people',
    hiddenAt: ['nation', 'state'],
    hiddenReason:
      'Under review: the model does not yet match the Census Bureau for people aged 65 and over.',
    theme: 'poverty',
    label: 'Seniors',
    valueLabel: 'of people aged 65 and over are in poverty (SPM)',
    format: percent,
    definition: `Share of people aged 65 and over ${SPM_DEFINITION}`,
    data: SPM_DATA,
    limits: `${SPM_LIMITS} Out-of-pocket medical costs weigh heavily for seniors and are imputed.`,
    links: [SPM_POST, SPM_LEVELS_POST],
  },
  {
    key: 'deep_poverty',
    combine: 'people',
    caveat: 'Few survey households are this far below the poverty line.',
    theme: 'poverty',
    label: 'Deep poverty',
    valueLabel: 'of people have resources below half the SPM threshold',
    format: percent,
    definition: 'Share of people whose family resources are below half of their SPM threshold.',
    data: SPM_DATA,
    limits: `Few survey households are this far below the threshold, and survey income is least accurate here. ${SPM_LIMITS}`,
    links: [SPM_POST, SPM_LEVELS_POST],
  },
  {
    key: 'median_household_net_income',
    theme: 'income',
    label: 'After taxes and benefits',
    valueLabel: 'median household income after taxes and benefits',
    format: thousands,
    definition:
      'Income of the middle household after federal and state taxes and after benefits, including the value of health benefits the model counts.',
    data: DATA_SENTENCE,
    limits:
      'Income after taxes and benefits, so it differs from the Census money-income median, which is before taxes. District incomes are calibrated to IRS adjusted gross income, a related but different concept.',
    links: [DATA_PIPELINE, CALIBRATION_TARGETS],
  },
  {
    key: 'median_household_market_income',
    theme: 'income',
    label: 'Before taxes and benefits',
    valueLabel: 'median household income before taxes and benefits',
    format: thousands,
    definition:
      'Income of the middle household from work, investments, pensions and other private sources, before taxes and benefits.',
    data: DATA_SENTENCE,
    limits:
      'Market income is close to, but not the same as, the Census money-income median, which also counts some cash benefits.',
    links: [DATA_PIPELINE, CALIBRATION_TARGETS],
  },
  {
    key: 'gini',
    caveat: 'Measured across households, with no adjustment for household size.',
    theme: 'inequality',
    label: 'Gini index',
    valueLabel: 'Gini index of household income after taxes and benefits',
    format: (value) => value.toFixed(2),
    definition:
      'Gini index of household income after taxes and benefits: 0 means every household has the same income; 1 means one household has it all.',
    data: DATA_SENTENCE,
    limits:
      'Measured across households, not people, and not adjusted for household size. Surveys capture top incomes poorly; IRS data fills part of the gap.',
    links: [DATA_PIPELINE],
  },
  {
    key: 'top_10_share',
    caveat: 'Top incomes come largely from IRS records that the data imputes.',
    theme: 'inequality',
    label: 'Top 10% share',
    valueLabel: 'of income after taxes and benefits goes to the top 10% of households',
    format: percent,
    definition:
      'Share of all household income after taxes and benefits that the highest-income 10% of households receive.',
    data: DATA_SENTENCE,
    limits:
      'Top incomes come largely from IRS-imputed records; small areas have few such households.',
    links: [DATA_PIPELINE],
  },
  {
    key: 'top_1_share',
    caveat: 'Top incomes come largely from IRS records that the data imputes.',
    hiddenAt: ['state'],
    hiddenReason: 'Shown for the nation only: in one state, a few very high incomes decide it.',
    theme: 'inequality',
    label: 'Top 1% share',
    valueLabel: 'of income after taxes and benefits goes to the top 1% of households',
    format: percent,
    definition:
      'Share of all household income after taxes and benefits that the highest-income 1% of households receive.',
    data: DATA_SENTENCE,
    limits:
      'Rests on very few households outside the nation as a whole, and on IRS-imputed top incomes.',
    links: [DATA_PIPELINE],
  },
  {
    key: 'state_income_tax_rate',
    caveat: 'Includes Maryland county income tax and New York City income tax.',
    theme: 'taxes',
    label: 'State income tax rate',
    valueLabel: 'of household income before taxes goes to state income tax',
    format: percent,
    definition:
      'State income tax, after state credits, as a share of household income before taxes and benefits. States with no income tax show zero; refundable credits can make a group’s rate negative.',
    data: `${DATA_SENTENCE} State income tax rules come from PolicyEngine's encoding of each state's law.`,
    limits:
      'Covers state income tax only, not sales, property or local income taxes, which matter most in states without an income tax.',
    links: [DATA_PIPELINE, CALIBRATION_TARGETS],
  },
  receipt('receipt_snap', 'recipients_snap', 'SNAP', 'household'),
  receipt('receipt_medicaid', 'recipients_medicaid', 'Medicaid', 'person'),
  receipt('receipt_eitc', 'recipients_eitc', 'the EITC', 'tax unit'),
  receipt('receipt_ctc', 'recipients_ctc', 'the Child Tax Credit', 'tax unit', {
    caveat: 'Higher than the IRS count of returns, which leaves out some claims.',
  }),
  receipt('receipt_aca_ptc', 'recipients_aca_ptc', 'ACA premium tax credits', 'person', {
    who: 'It counts eligible people in a tax unit that takes up the credit and gets more than $0. CMS counts plan selections with advance credits at open enrollment.',
    caveat: 'About half of the CMS count of enrollees with credits.',
    nationOnly: true,
  }),
  receipt('receipt_ssi', 'recipients_ssi', 'SSI', 'person', { nationOnly: true }),
  receipt(
    'receipt_school_meals',
    'recipients_school_meals',
    'free or reduced-price school meals',
    'school-age child',
    {
      who: 'It counts children aged 5 to 17 in a family that qualifies. USDA counts lunches served on an average school day, so its count is lower.',
    }
  ),
  receipt('receipt_wic', 'recipients_wic', 'WIC', 'person', { nationOnly: true }),
  receipt('receipt_tanf', 'recipients_tanf', 'TANF', 'family', { nationOnly: true }),
  receipt('receipt_social_security', 'recipients_social_security', 'Social Security', 'person'),
];

/** Figures the card shows in its breakdowns but the map does not color by. */
export const CARD_ONLY_FORMATS: Partial<Record<BaselineMetricKey, (value: number) => string>> = {
  eitc_per_recipient: dollars,
  ctc_per_recipient: dollars,
};

export const DEFAULT_METRIC = EXPLORE_METRICS[0];

export function exploreMetric(key: string | null | undefined): ExploreMetric {
  return EXPLORE_METRICS.find((metric) => metric.key === key) ?? DEFAULT_METRIC;
}

export function themeMetrics(theme: ExploreTheme): ExploreMetric[] {
  return EXPLORE_METRICS.filter((metric) => metric.theme === theme);
}

/** The card's summary row: one headline measure per theme. */
export const HEADLINE_METRICS: ExploreMetric[] = THEMES.map(({ key }) => themeMetrics(key)[0]);

/** Why the page stops at states. */
export const DISTRICTS_HIDDEN_NOTE =
  'Congressional districts are not shown yet. District figures do not yet match survey estimates (microcosm#1673).';

/** Whether the page shows a value for the measure at a level. */
export function isShownAt(metric: ExploreMetric, level: ShownLevel): boolean {
  return !metric.hiddenAt?.includes(level);
}

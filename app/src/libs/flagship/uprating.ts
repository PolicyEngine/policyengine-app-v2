import { CURRENT_YEAR, FOREVER } from '@/constants';
import { CountryId } from '@/libs/countries';
import {
  DraftProvision,
  provisionChanged,
  provisionIntervals,
  setDraftProvisionIntervals,
} from '@/libs/draftReform';
import { ParameterMetadata, ParameterMetadataCollection } from '@/types/metadata/parameterMetadata';
import { ValueInterval, ValueIntervalCollection } from '@/types/subIngredients/valueInterval';

/**
 * How a value set from one year on moves in the years after it.
 *
 * A reform value replaces current law for every year it covers — so
 * setting an indexed amount ($16,100 standard deduction → $18,000)
 * freezes it, while current law would have grown it. Growth makes the
 * later years explicit: held fixed, grown as current law grows, or grown
 * with an inflation index from the model's own metadata.
 */
export type Growth = 'fixed' | 'current_law' | string;

export interface GrowthIndex {
  /** The index's parameter path in the metadata */
  path: string;
  label: string;
  /** For a row's narrow "When" chip */
  short: string;
}

/** Indexes offered where the metadata carries them, most used first. */
const INDEXES: Record<string, GrowthIndex[]> = {
  us: [
    { path: 'gov.bls.cpi.cpi_u', label: 'CPI-U', short: 'CPI-U' },
    { path: 'gov.bls.cpi.c_cpi_u', label: 'Chained CPI-U', short: 'C-CPI-U' },
    { path: 'gov.irs.uprating', label: 'IRS inflation adjustment', short: 'IRS index' },
    { path: 'gov.bls.cpi.cpi_w', label: 'CPI-W', short: 'CPI-W' },
    { path: 'gov.ssa.nawi', label: 'Average wage index', short: 'wages' },
  ],
  uk: [
    {
      path: 'gov.economic_assumptions.indices.obr.consumer_price_index',
      label: 'CPI',
      short: 'CPI',
    },
    { path: 'gov.economic_assumptions.indices.obr.cpih', label: 'CPIH', short: 'CPIH' },
    { path: 'gov.economic_assumptions.indices.obr.rpi', label: 'RPI', short: 'RPI' },
    {
      path: 'gov.economic_assumptions.indices.obr.average_earnings',
      label: 'Average earnings',
      short: 'earnings',
    },
  ],
};

const MONEY_UNITS = new Set([
  'currency-USD',
  'currency_USD',
  'USD',
  'currency-GBP',
  'currency_GBP',
  'GBP',
]);

/** Only money grows with prices: not rates, switches, ages, counts or years. */
export function canGrow(param: Pick<ParameterMetadata, 'unit'> | undefined): boolean {
  return MONEY_UNITS.has(String(param?.unit));
}

/**
 * Whether current law already grows the parameter: the model projects
 * values for the years ahead. Indexed parameters carry a value for every
 * year to 2100; a law that just schedules a change has one or two.
 */
export function alreadyGrows(param: Pick<ParameterMetadata, 'values'> | undefined): boolean {
  const thisYear = Number(CURRENT_YEAR);
  const years = new Set(
    Object.keys(param?.values ?? {})
      .map((date) => Number(date.slice(0, 4)))
      .filter((year) => year > thisYear)
  );
  return years.size >= 3;
}

/** The growth a money parameter takes unless the user picks another. */
export function defaultGrowth(param: ParameterMetadata | undefined): Growth {
  return canGrow(param) && alreadyGrows(param) ? 'current_law' : 'fixed';
}

/**
 * A provision's growth: the one chosen; else, for a value already set
 * without one (before growth existed, or from a bill), the fixed value it
 * holds; else, for a value not yet set, its parameter's default.
 */
export function growthOf(
  provision: Pick<DraftProvision, 'growth' | 'value' | 'baselineValue' | 'intervals'> | undefined,
  param: ParameterMetadata | undefined
): Growth {
  if (!canGrow(param)) {
    return 'fixed';
  }
  if (provision?.growth) {
    return provision.growth;
  }
  return provision && provisionChanged(provision) ? 'fixed' : defaultGrowth(param);
}

export function availableIndexes(
  countryId: string,
  parameters: ParameterMetadataCollection
): GrowthIndex[] {
  return (INDEXES[countryId] ?? []).filter(
    (index) => Object.keys(parameters[index.path]?.values ?? {}).length > 0
  );
}

/** The menu of ways a value can move, for the parameters at hand. */
export function growthOptions(
  countryId: string,
  params: Array<ParameterMetadata | undefined>,
  parameters: ParameterMetadataCollection
): Array<{ value: Growth; label: string }> {
  const money = params.filter(canGrow);
  if (money.length === 0) {
    return [];
  }
  return [
    { value: 'fixed', label: 'Stays at this value' },
    ...(money.some(alreadyGrows)
      ? [{ value: 'current_law', label: 'Grows as current law does' }]
      : []),
    ...availableIndexes(countryId, parameters).map((index) => ({
      value: index.path,
      label: `Grows with ${index.label}`,
    })),
  ];
}

/**
 * How a value grows, for a row's summary: "grows with CPI-U" — or, for
 * the narrow "When" chip, just "CPI-U" or "indexed". Empty when it stays put.
 */
export function growthPhrase(growth: Growth | undefined, countryId: string, short = false): string {
  if (!growth || growth === 'fixed') {
    return '';
  }
  if (growth === 'current_law') {
    return short ? 'indexed' : 'grows as current law does';
  }
  const index = (INDEXES[countryId] ?? []).find((candidate) => candidate.path === growth);
  return short ? (index?.short ?? 'indexed') : `grows with ${index?.label ?? growth}`;
}

const at = (series: ValueIntervalCollection, year: number) => {
  const value = series.getValueAtDate(`${year}-01-01`);
  return typeof value === 'number' ? value : null;
};

export type RoundMode = 'nearest' | 'down' | 'up';

/**
 * How grown values round: to a multiple of `roundTo` — up, down, or to
 * the nearest — as laws round indexed amounts ("rounded to the next
 * lowest multiple of $50").
 */
export interface GrowthRounding {
  roundTo: number;
  round: RoundMode;
}

/** Steps current law's own projections are tested against, largest first. */
const STEPS = [10000, 5000, 1000, 500, 100, 50, 25, 10, 5];

/**
 * The rounding a value starts with: for an amount current law indexes,
 * the step its projected values all land on, rounded down as most indexed
 * amounts are; otherwise whole units — or cents, for an amount with cents.
 */
export function defaultRounding(
  param: ParameterMetadata | undefined,
  amount?: number
): GrowthRounding {
  if (alreadyGrows(param)) {
    const thisYear = Number(CURRENT_YEAR);
    const ahead = Object.entries(param?.values ?? {})
      .filter(([date]) => Number(date.slice(0, 4)) > thisYear)
      .map(([, value]) => value)
      .filter((value): value is number => typeof value === 'number' && value !== 0);
    const step = STEPS.find((candidate) =>
      ahead.every((value) => Math.abs(value / candidate - Math.round(value / candidate)) < 1e-9)
    );
    if (step && ahead.length > 0) {
      return { roundTo: step, round: 'down' };
    }
  }
  return {
    roundTo: amount !== undefined && !Number.isInteger(amount) ? 0.01 : 1,
    round: 'nearest',
  };
}

export function growthRounding(
  chosen: Partial<GrowthRounding> | null | undefined,
  param: ParameterMetadata | undefined,
  amount?: number
): GrowthRounding {
  const fallback = defaultRounding(param, amount);
  return { roundTo: chosen?.roundTo ?? fallback.roundTo, round: chosen?.round ?? fallback.round };
}

export function roundValue(value: number, { roundTo, round }: GrowthRounding): number {
  const steps = value / roundTo;
  // A hair of tolerance, so 2050.0000001 rounds down to 2,050, not 2,000.
  const whole =
    round === 'down'
      ? Math.floor(steps + 1e-9)
      : round === 'up'
        ? Math.ceil(steps - 1e-9)
        : Math.round(steps);
  return Number((whole * roundTo).toFixed(2));
}

/**
 * When growth applies: the first year the value moves (`start`), and the
 * year whose index level it moves from (`base`). A law that says "$2,500,
 * adjusted for inflation after 2027 from a 2026 base" is start 2028,
 * base 2026. By default it moves the year after it is set, from that year.
 */
export interface GrowthTiming {
  start: number;
  base: number;
}

export function growthTiming(
  startYear: number,
  chosen?: Partial<GrowthTiming> | null
): GrowthTiming {
  // Never before the value's own first year moves; the base before that.
  const start = Math.max(chosen?.start ?? startYear + 1, startYear + 1);
  const base = Math.min(chosen?.base ?? startYear, start - 1);
  return { start, base };
}

/** The years a series has a level for, to offer as base years. */
export function seriesYears(
  growth: Growth,
  param: ParameterMetadata | undefined,
  parameters: ParameterMetadataCollection
): number[] {
  const values = growth === 'current_law' ? param?.values : parameters[growth]?.values;
  return [...new Set(Object.keys(values ?? {}).map((date) => Number(date.slice(0, 4))))].sort(
    (a, b) => a - b
  );
}

/**
 * The intervals a value from `startYear` on takes under a growth: one
 * open-ended interval when fixed; else a value a year to `lastYear`, held
 * from then on — the amount itself until growth starts, then the amount
 * scaled by the series' level that year over its level in the base year,
 * rounded as chosen.
 */
export function grownIntervals(
  value: number,
  startYear: number,
  lastYear: number,
  growth: Growth,
  param: ParameterMetadata | undefined,
  parameters: ParameterMetadataCollection,
  timing: GrowthTiming = growthTiming(startYear),
  rounding: GrowthRounding = defaultRounding(undefined, value)
): ValueInterval[] {
  const fixed = [{ startDate: `${startYear}-01-01`, endDate: FOREVER, value }];
  if (growth === 'fixed' || lastYear <= startYear) {
    return fixed;
  }
  const seriesValues = growth === 'current_law' ? param?.values : parameters[growth]?.values;
  const series = new ValueIntervalCollection(seriesValues ?? {});
  const base = at(series, timing.base);
  if (!base) {
    return fixed;
  }
  const intervals: ValueInterval[] = [];
  for (let year = startYear; year <= lastYear; year++) {
    const level = at(series, year) ?? base;
    intervals.push({
      startDate: `${year}-01-01`,
      endDate: year === lastYear ? FOREVER : `${year}-12-31`,
      value: year < timing.start ? value : roundValue((value * level) / base, rounding),
    });
  }
  return intervals;
}

/**
 * Sets a provision's value from `year` on, moving after it by `growth`
 * and `timing`. Changes before `year` stay; everything from it is rewritten.
 */
export function setValueFromYear({
  countryId,
  provision,
  year,
  value,
  growth,
  timing,
  rounding,
  param,
  parameters,
  lastYear,
}: {
  countryId: CountryId;
  provision: Omit<DraftProvision, 'intervals'> & { intervals?: ValueInterval[] };
  year: number;
  value: any;
  growth: Growth;
  /** Omitted, the provision's own timing, else the default. */
  timing?: Partial<GrowthTiming>;
  /** Omitted, the provision's own rounding, else the parameter's default. */
  rounding?: Partial<GrowthRounding>;
  param: ParameterMetadata | undefined;
  parameters: ParameterMetadataCollection;
  lastYear: number;
}): void {
  const effective = typeof value === 'number' && canGrow(param) ? growth : 'fixed';
  const when = growthTiming(
    year,
    timing ?? { start: provision.growthStart, base: provision.growthBase }
  );
  const rounded = growthRounding(
    rounding ?? { roundTo: provision.growthRoundTo, round: provision.growthRound },
    param,
    typeof value === 'number' ? value : undefined
  );
  const collection = new ValueIntervalCollection(
    provisionChanged(provision) ? provisionIntervals(provision) : []
  );
  for (const interval of grownIntervals(
    value,
    year,
    lastYear,
    effective,
    param,
    parameters,
    when,
    rounded
  )) {
    collection.addInterval(interval);
  }
  setDraftProvisionIntervals(
    countryId,
    provision,
    collection.getIntervals(),
    canGrow(param) ? effective : undefined,
    effective === 'fixed' ? undefined : { ...when, ...rounded }
  );
}

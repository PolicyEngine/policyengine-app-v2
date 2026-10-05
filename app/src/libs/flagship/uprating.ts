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

/** Whole units for whole amounts, cents otherwise. */
const roundLike = (value: number, like: number) =>
  Number.isInteger(like) ? Math.round(value) : Math.round(value * 100) / 100;

/**
 * The intervals a value from `startYear` on takes under a growth: one
 * open-ended interval when fixed, else a value a year — the start value
 * scaled as the series grows — to `lastYear`, held from then on.
 */
export function grownIntervals(
  value: number,
  startYear: number,
  lastYear: number,
  growth: Growth,
  param: ParameterMetadata | undefined,
  parameters: ParameterMetadataCollection
): ValueInterval[] {
  const fixed = [{ startDate: `${startYear}-01-01`, endDate: FOREVER, value }];
  if (growth === 'fixed' || lastYear <= startYear) {
    return fixed;
  }
  const seriesValues = growth === 'current_law' ? param?.values : parameters[growth]?.values;
  const series = new ValueIntervalCollection(seriesValues ?? {});
  const base = at(series, startYear);
  if (!base) {
    return fixed;
  }
  const intervals: ValueInterval[] = [];
  for (let year = startYear; year <= lastYear; year++) {
    const level = at(series, year) ?? base;
    intervals.push({
      startDate: `${year}-01-01`,
      endDate: year === lastYear ? FOREVER : `${year}-12-31`,
      value: year === startYear ? value : roundLike((value * level) / base, value),
    });
  }
  return intervals;
}

/**
 * Sets a provision's value from `year` on, moving after it by `growth`.
 * Changes before `year` stay; everything from it is rewritten.
 */
export function setValueFromYear({
  countryId,
  provision,
  year,
  value,
  growth,
  param,
  parameters,
  lastYear,
}: {
  countryId: CountryId;
  provision: Omit<DraftProvision, 'intervals'> & { intervals?: ValueInterval[] };
  year: number;
  value: any;
  growth: Growth;
  param: ParameterMetadata | undefined;
  parameters: ParameterMetadataCollection;
  lastYear: number;
}): void {
  const effective = typeof value === 'number' && canGrow(param) ? growth : 'fixed';
  const collection = new ValueIntervalCollection(
    provisionChanged(provision) ? provisionIntervals(provision) : []
  );
  for (const interval of grownIntervals(value, year, lastYear, effective, param, parameters)) {
    collection.addInterval(interval);
  }
  setDraftProvisionIntervals(
    countryId,
    provision,
    collection.getIntervals(),
    canGrow(param) ? effective : undefined
  );
}

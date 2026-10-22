import type { CountryId } from '@/libs/countries';
import { Household } from '@/models/Household';

/**
 * Helpers for v3's household reports: the report section's households and
 * the standalone household report (one household, run under a baseline
 * and, optionally, a reform).
 */

/**
 * Where a household in each UK nation lives unless the reader says
 * otherwise: the nation's region, with its capital's local authority and
 * Broad Rental Market Area, so the three name one place. England has no
 * one region; its households keep the model's defaults.
 */
const UK_NATION_PLACES: Record<string, Record<string, string>> = {
  scotland: { region: 'SCOTLAND', local_authority: 'CITY_OF_EDINBURGH', brma: 'LOTHIAN' },
  wales: { region: 'WALES', local_authority: 'CARDIFF', brma: 'CARDIFF' },
  northern_ireland: { region: 'NORTHERN_IRELAND', local_authority: 'BELFAST', brma: 'BELFAST' },
};

/** A UK report's nation's place, for "country/scotland"; none for any other region. */
export function ukNationPlace(region: string | undefined): Record<string, string> | null {
  const match = /^country\/(.+)$/i.exec(region ?? '');
  return (match && UK_NATION_PLACES[match[1].toLowerCase()]) || null;
}

/**
 * A new household for v3's report section or standalone household report:
 * the household builder's own start, one adult and nothing else set. A US
 * household starts on national poverty thresholds, which the builder's SPM
 * geography choice can change to a county's; only the US model has them.
 * A UK household in a report on Scotland, Wales or Northern Ireland starts
 * there.
 */
export function newV3Household(countryId: CountryId, year: string, region?: string): Household {
  const household = Household.starter(countryId, year);
  if (countryId === 'us') {
    return household.withSPM({ geography_kind: 'national' });
  }
  const place = countryId === 'uk' ? ukNationPlace(region) : null;
  const group = household.getPreferredGroupName('households');
  if (!place || !group) {
    return household;
  }
  return Object.entries(place).reduce(
    (current, [name, value]) =>
      current.setEntityVariableAtYear('households', group, name, year, value),
    household
  );
}

/**
 * Inputs every household carries that say nothing on a chart against
 * earnings: the earnings the chart varies, and age, which the household
 * builder sets for everyone.
 */
const NOT_OFFERED_ON_EARNINGS_CHART = new Set(['employment_income', 'age']);

/** Whether an input's value, or any of its yearly values, is a nonzero amount. */
function setsAnAmount(value: unknown): boolean {
  const amounts =
    value && typeof value === 'object' && !Array.isArray(value)
      ? Object.values(value as Record<string, unknown>)
      : [value];
  return amounts.some((amount) => typeof amount === 'number' && amount !== 0);
}

/**
 * The amounts the household itself sets, by variable name, in the order
 * first met: tip income for a household with tips. The earnings variation
 * offers these beside its calculated variables (issue #1096).
 */
export function householdAmountInputs(household: Household): string[] {
  const variables = [
    ...household
      .getAllPeople()
      .flatMap((person) => household.getPersonVariableEntries(person.name)),
    ...household.getConfiguredGroupsWithVariables().flatMap((group) => group.variables),
  ];
  const names = variables
    .filter(
      (variable) =>
        !NOT_OFFERED_ON_EARNINGS_CHART.has(variable.name) && setsAnAmount(variable.value)
    )
    .map((variable) => variable.name);
  return [...new Set(names)];
}

/**
 * The period a household input's entered value covers, for labelling it
 * ("Annually" under "Rent").
 *
 * The household builder stores every value under the household's tax year
 * (`Household.setEntityVariableAtYear`) and sends it to the API as
 * `{ "<year>": value }`, whatever period the model defines the variable
 * over. PolicyEngine core splits a yearly money amount evenly across the
 * months of a variable defined per month (`set_input_divide_by_period`, the
 * default for flow quantities), so a money amount entered here is always
 * the total for the year.
 */

/** The fields this module reads from a variable's metadata. */
export interface VariablePeriodFields {
  unit?: string | null;
  /** The model's definition period: "year", "month", "week", "day" or "eternity". */
  definitionPeriod?: string | null;
  /**
   * "stock" for a balance or value at one point in time (bank account
   * assets, a home's value), "flow" for an amount over a period. Money is a
   * flow unless the model marks it as a stock.
   */
  quantityType?: string | null;
}

/** Periods the builder sends as one yearly value, which core spreads over the year. */
const YEARLY_ENTRY_PERIODS = new Set(['year', 'month']);

const PERIOD_ADVERBS: Record<string, string> = {
  year: 'Annually',
  month: 'Monthly',
  week: 'Weekly',
  day: 'Daily',
};

function isMoneyAmount(unit: string | null | undefined): boolean {
  return typeof unit === 'string' && unit.startsWith('currency-');
}

/**
 * How often a period comes around, as a label: "Annually", "Monthly",
 * "Weekly", "Daily", or "Per <period>" for any other period the model
 * defines. None for a value that holds for all time (eternity) or when
 * there is no period.
 */
export function periodLabel(period: string | null | undefined): string | null {
  if (!period || period === 'eternity') {
    return null;
  }
  return PERIOD_ADVERBS[period] ?? `Per ${period}`;
}

/**
 * The period an entered value covers, or none when a period does not
 * apply. Only money amounts over a period have one: other inputs describe
 * a state (yes or no, one of a list, a count, an age, a rate), which core
 * copies into each month rather than divides, or name their own period
 * ("hours per day"); a balance or value (a stock) is an amount at one
 * point in time. Money defined per year or per month is entered for the
 * year. The builder would send money defined per week or per day under
 * the year too, which core accepts only for yearly and monthly variables,
 * so no household input uses those periods; the label then names the
 * model's period.
 */
export function enteredValuePeriod(variable: VariablePeriodFields): string | null {
  if (
    !isMoneyAmount(variable.unit) ||
    !variable.definitionPeriod ||
    variable.quantityType === 'stock'
  ) {
    return null;
  }
  if (variable.definitionPeriod === 'eternity') {
    return null;
  }
  return YEARLY_ENTRY_PERIODS.has(variable.definitionPeriod) ? 'year' : variable.definitionPeriod;
}

/** The label for the period an entered value covers: "Annually" for rent. */
export function enteredValuePeriodLabel(variable: VariablePeriodFields): string | null {
  return periodLabel(enteredValuePeriod(variable));
}

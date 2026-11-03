import {
  timePeriodsFrom,
  yearValues,
  type YearListMetadata,
} from '@/tests/fixtures/libs/yearListMocks';
import type { ParameterMetadata } from '@/types/metadata/parameterMetadata';
import type { PolicyStateProps } from '@/types/pathwayState';
import type { ValueInterval } from '@/types/subIngredients/valueInterval';

/** A money parameter with current-law values, as metadata lists it. */
export const CTC_BASE_PARAMETER: ParameterMetadata = {
  parameter: 'gov.irs.credits.ctc.amount.base',
  label: 'Child tax credit base amount',
  type: 'parameter',
  unit: 'currency-USD',
  values: { '2022-01-01': 2000, '2025-01-01': 2200 },
  economy: true,
  household: true,
};

/** A policy that changes nothing yet. */
export const EMPTY_POLICY: PolicyStateProps = { label: null, parameters: [] };

/** The report year the editors open on. */
export const EDITOR_REPORT_YEAR = '2026';

/**
 * Society-wide years 2024 to 2028, household years 2022 to 2035: the
 * editors should offer the household years.
 */
export const POLICY_EDITOR_YEAR_LISTS: YearListMetadata = {
  societyWideYears: timePeriodsFrom(2024, 2028),
  householdYears: timePeriodsFrom(2022, 2035),
};

/** The ten household years from the report year on: a US multi-year editor's years. */
export const HOUSEHOLD_YEARS_FROM_REPORT_YEAR = yearValues(timePeriodsFrom(2026, 2035));

/** The first and last household years, as a year input's bounds. */
export const HOUSEHOLD_YEAR_BOUNDS = { min: '2022', max: '2035' } as const;

/** The props every value setter takes besides its parameter and policy. */
export function valueSetterProps() {
  return {
    minDate: '2022-01-01',
    maxDate: '2035-12-31',
    intervals: [] as ValueInterval[],
    setIntervals: () => {},
    startDate: `${EDITOR_REPORT_YEAR}-01-01`,
    setStartDate: () => {},
    endDate: `${EDITOR_REPORT_YEAR}-12-31`,
    setEndDate: () => {},
  };
}

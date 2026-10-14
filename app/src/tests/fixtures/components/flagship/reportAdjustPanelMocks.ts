import type { RunReportProvision } from '@/libs/flagship/runReport';

export const CTC_BASE_PATH = 'gov.irs.credits.ctc.amount.base[0].amount';

/** A report year before the current one: the year picker offers it. */
export const PAST_REPORT_YEAR = '2024';
/** A report year after the first year of a phased reform. */
export const PHASED_REPORT_YEAR = '2027';

/** One Child Tax Credit value from the current year on, as most reports run it. */
export const FLAT_CTC_PROVISION: RunReportProvision = {
  path: CTC_BASE_PATH,
  breadcrumb: 'IRS → Credits → Child tax credit → Base amount',
  unit: 'currency-USD',
  baselineValue: 2000,
  value: 2500,
};

/** A phased Child Tax Credit: 2,500 in 2026, then 3,000 from 2027 on. */
export const PHASED_CTC_INTERVALS = [
  { startDate: '2026-01-01', endDate: '2026-12-31', value: 2500 },
  { startDate: '2027-01-01', endDate: '2100-12-31', value: 3000 },
];

/** The phased credit as a 2027 report shows it: 3,000 that year. */
export const PHASED_CTC_PROVISION: RunReportProvision = {
  ...FLAT_CTC_PROVISION,
  value: 3000,
  intervals: PHASED_CTC_INTERVALS,
};

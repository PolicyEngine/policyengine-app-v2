import type { FlagshipReportRecord } from '@/api/flagshipReportStore';
import type { RunReportProvision } from '@/libs/flagship/runReport';

/** The report a run creates: its API report id. */
export const NEW_REPORT_ID = '9100';

/** A report run earlier from the same reform, as Your reforms listed it. */
export const EARLIER_REPORT_ID = '9050';

/** The saved reform the run comes from. */
export const RUN_REFORM_ID = 'rf-ctc';

export const RUN_TITLE = 'Bigger CTC';

/** One provision: the CTC raised to 2,500. */
export const RUN_PROVISIONS: RunReportProvision[] = [
  {
    path: 'gov.irs.credits.ctc.amount.base[0].amount',
    breadcrumb: 'IRS → Credits → CTC → Base amount',
    unit: 'currency-USD',
    baselineValue: 2200,
    value: 2500,
  },
];

const reportRecord = (id: string, apiReportId: string, createdAt: string) => ({
  id,
  countryId: 'us' as const,
  apiReportId,
  title: RUN_TITLE,
  sourceNote: null,
  provisions: RUN_PROVISIONS,
  year: '2026',
  createdAt,
  reformId: RUN_REFORM_ID,
});

/** What Your reforms had listed for the reform before the run. */
export const EARLIER_REPORTS: FlagshipReportRecord[] = [
  reportRecord('fr-earlier', EARLIER_REPORT_ID, '2026-10-01T00:00:00Z'),
];

/** What it lists once the run saved its report. */
export const REPORTS_AFTER_RUN: FlagshipReportRecord[] = [
  reportRecord('fr-new', NEW_REPORT_ID, '2026-10-15T00:00:00Z'),
  ...EARLIER_REPORTS,
];

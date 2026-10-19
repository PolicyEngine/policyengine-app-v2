import { render, screen } from '@test-utils';
import { describe, expect, test } from 'vitest';
import ReportChanges from '@/components/flagship/report/ReportChanges';
import { FOREVER } from '@/constants';
import type { RunReportProvision } from '@/libs/flagship/runReport';

/** A UK capital limit the live metadata gives the unit "GBP", from the tax year's start. */
const UK_PROVISION: RunReportProvision = {
  path: 'gov.dwp.ESA.income.capital.limit',
  breadcrumb: 'DWP → ESA → Income → Capital → Income-related ESA capital limit',
  unit: 'GBP',
  baselineValue: 16000,
  value: 15000,
  intervals: [{ startDate: '2026-04-06', endDate: FOREVER, value: 15000 }],
};

const US_PROVISION: RunReportProvision = {
  path: 'gov.irs.credits.ctc.amount.base[0].amount',
  breadcrumb: 'IRS → Credits → Child tax credit → Base amount',
  unit: 'currency-USD',
  baselineValue: 2000,
  value: 2500,
  intervals: [{ startDate: '2026-01-01', endDate: FOREVER, value: 2500 }],
};

describe('ReportChanges', () => {
  test('given a UK change in "GBP" then its values read in pounds and its date day first', () => {
    render(<ReportChanges provisions={[UK_PROVISION]} />, 'uk');

    expect(screen.getAllByText('£16,000').length).toBeGreaterThan(0);
    expect(screen.getAllByText('£15,000').length).toBeGreaterThan(0);
    expect(screen.getByText('6 Apr 2026')).toBeInTheDocument();
    expect(screen.getByText('From 6 Apr 2026')).toBeInTheDocument();
  });

  test('given a US change then its date reads month first, as before', () => {
    render(<ReportChanges provisions={[US_PROVISION]} />, 'us');

    expect(screen.getAllByText('$2,500').length).toBeGreaterThan(0);
    expect(screen.getByText('Jan 1, 2026')).toBeInTheDocument();
    expect(screen.getByText('From Jan 1, 2026')).toBeInTheDocument();
  });
});

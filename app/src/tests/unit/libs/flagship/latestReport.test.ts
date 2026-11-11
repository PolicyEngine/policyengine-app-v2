import { beforeEach, describe, expect, test } from 'vitest';
import type { FlagshipReportRecord } from '@/api/flagshipReportStore';
import { latestMatchingReport } from '@/libs/flagship/latestReport';
import { saveReportMeta } from '@/libs/flagship/runReport';
import type { Reform } from '@/types/ingredients/Reform';

const PATH = 'gov.states.ny.tax.income.credits.ctc.amount.minimum';
const VALUES = [
  { startDate: '2026-01-01', endDate: '2026-12-31', value: 400 },
  { startDate: '2027-01-01', endDate: '2100-12-31', value: 500 },
];
const REFORM = {
  id: 'rf-ny',
  countryId: 'us',
  label: 'NY CTC',
  parameters: [{ name: PATH, values: VALUES }],
  baseline: 'current-law',
  provenance: { source: 'manual' },
} as Reform;

/** A `/v2/user-reports` row's ID: an account report's link. */
const ACCOUNT_REPORT_ID = '44444444-4444-4444-8444-444444444444';

const report = (overrides: Partial<FlagshipReportRecord>): FlagshipReportRecord => ({
  id: 'rec',
  countryId: 'us',
  apiReportId: '1',
  title: 'NY CTC',
  sourceNote: null,
  provisions: [
    { path: PATH, breadcrumb: '', unit: null, baselineValue: 100, value: 400, intervals: VALUES },
  ],
  year: '2026',
  createdAt: '2026-10-14T10:00:00Z',
  reformId: 'rf-ny',
  ...overrides,
});

describe('latestMatchingReport', () => {
  beforeEach(() => localStorage.clear());

  test('given reports of the same values then the newest opens', () => {
    const older = report({ id: 'a', apiReportId: '1', createdAt: '2026-10-13T10:00:00Z' });
    const newer = report({ id: 'b', apiReportId: '2', createdAt: '2026-10-14T10:00:00Z' });

    expect(latestMatchingReport(REFORM, [older, newer], 2026)?.id).toBe('b');
  });

  test('given the reform changed since then its old report does not open', () => {
    const changed = {
      ...REFORM,
      parameters: [{ name: PATH, values: [{ ...VALUES[0], value: 450 }, VALUES[1]] }],
    };

    expect(latestMatchingReport(changed, [report({})], 2026)).toBeNull();
  });

  test('given another year or a saved-reform comparison then it does not open', () => {
    saveReportMeta('9', {
      title: 'NY CTC',
      sourceNote: '',
      provisions: [],
      createdAt: '2026-10-14T10:00:00Z',
      baseline: { reformId: 'rf-b', policyId: '88', label: 'Plan B' },
    });

    expect(
      latestMatchingReport(REFORM, [report({ year: '2027' }), report({ apiReportId: '9' })], 2026)
    ).toBeNull();
  });

  test('given an account report compared with a saved reform after a reload then it does not open', () => {
    // Given: no run details in this page session, only the row's link to the saved reform
    const accountReport = report({ id: ACCOUNT_REPORT_ID, baselineReformId: 'rf-plan-b' });

    // Then
    expect(latestMatchingReport(REFORM, [accountReport], 2026)).toBeNull();
  });

  test('given an account report against current law then it opens', () => {
    // Given
    const accountReport = report({ id: ACCOUNT_REPORT_ID, baselineReformId: null });

    // Then
    expect(latestMatchingReport(REFORM, [accountReport], 2026)?.id).toBe(ACCOUNT_REPORT_ID);
  });

  test('given a report whose baseline ran another reform then it does not open, linked or not', () => {
    // Given: no run details and no link, but its baseline was not current law
    const unlinked = {
      ...report({ id: ACCOUNT_REPORT_ID, baselineReformId: null }),
      baselinePolicyId: '88',
    };

    // When / Then
    expect(latestMatchingReport(REFORM, [unlinked], 2026, 2)).toBeNull();
  });

  test('given a report whose baseline ran current law then it opens', () => {
    const againstCurrentLaw = { ...report({ id: ACCOUNT_REPORT_ID }), baselinePolicyId: '2' };

    expect(latestMatchingReport(REFORM, [againstCurrentLaw], 2026, 2)?.id).toBe(ACCOUNT_REPORT_ID);
  });
});

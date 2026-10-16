/**
 * Report records and provenance in every shape the app has stored in the
 * browser, from git history (`git log -p` on runReport.ts and
 * flagshipReportStore.ts), with what each reads as today.
 */
import type { FlagshipReportRecord } from '@/api/flagshipReportStore';
import type { ReportMetaFields } from '@/libs/flagship/reportSchema';
import type { FlagshipReportMeta, RunReportProvision } from '@/libs/flagship/runReport';
import { mockReportValidationSnapshot } from '@/tests/fixtures/libs/flagship/reportValidationMocks';

/** The report on the PolicyEngine API that the records point at. */
export const API_REPORT_ID = '4512';
/** A saved reform a record links to. */
export const SAVED_REFORM_ID = '0b6f0c1e-5d0a-4c38-9a51-6c7f2f3e8a01';

export const REPORT_META_KEY = 'pe-flagship-report-meta';
export const REPORTS_KEY = 'pe-flagship-reports';

/** The version this app stamps; a later one is "newer". */
export const CURRENT_SCHEMA_VERSION = 2;
export const NEWER_SCHEMA_VERSION = 3;

export const LOCAL_REPORT_ID = 'lfr-mfz1abcdef';
export const OTHER_LOCAL_REPORT_ID = 'lfr-mfz2ghijkl';
export const CREATED_AT = '2026-09-03T00:00:00.000Z';

export const CTC_PROVISION: RunReportProvision = {
  path: 'gov.irs.credits.ctc.amount.base[0].amount',
  breadcrumb: 'IRS → Credits → CTC → Amount',
  unit: 'currency-USD',
  baselineValue: 2200,
  value: 2500,
};

export const DATED_CTC_PROVISION: RunReportProvision = {
  ...CTC_PROVISION,
  intervals: [
    { startDate: '2026-01-01', endDate: '2026-12-31', value: 2500 },
    { startDate: '2027-01-01', endDate: '2100-12-31', value: 3000 },
  ],
};

/** A value set from 2026 that grows with CPI-U after it, as Build's one-value editor saves it. */
export const GROWING_PROVISION: RunReportProvision = {
  path: 'gov.irs.deductions.standard.amount.SINGLE',
  breadcrumb: 'IRS → Deductions → Standard deduction → Single',
  unit: 'currency-USD',
  baselineValue: 16100,
  value: 18000,
  intervals: [
    { startDate: '2026-01-01', endDate: '2026-12-31', value: 18000 },
    { startDate: '2027-01-01', endDate: '2027-12-31', value: 18450 },
  ],
  growth: 'gov.bls.cpi.cpi_u',
  growthStart: 2027,
  growthBase: 2026,
  growthRoundTo: 50,
  growthRound: 'down',
};

/* Provenance meta, stored under REPORT_META_KEY by report id. */

/** 3673cf94 "Build the run bridge": the first shape. */
export const metaFromRunBridge = {
  title: 'CTC to $2,500',
  sourceNote: 'Hand-built draft',
  provisions: [CTC_PROVISION],
  createdAt: CREATED_AT,
};

/** ebb805b5 "Build: make the reform the page": provisions with dated changes. */
export const metaWithIntervals = { ...metaFromRunBridge, provisions: [DATED_CTC_PROVISION] };

/** 42c22f3a "Build: let a value grow with inflation, …": a provision's growth. */
const {
  growthStart: _growthStart,
  growthBase: _growthBase,
  growthRoundTo: _growthRoundTo,
  growthRound: _growthRound,
  ...provisionWithGrowth
} = GROWING_PROVISION;
export const metaWithGrowth = {
  ...metaWithIntervals,
  provisions: [DATED_CTC_PROVISION, provisionWithGrowth],
};

/** e02a17ef "Build: … set when and how they grow and round": its timing and rounding. */
export const metaWithGrowthTiming = {
  ...metaWithIntervals,
  provisions: [DATED_CTC_PROVISION, GROWING_PROVISION],
};

/** aaf850a6 "Build: choose the budget window before the run". */
export const metaWithBudgetWindow = {
  ...metaWithGrowthTiming,
  budgetWindow: { startYear: 2026, windowSize: 10 },
};

/** What a report compared the reform with, when not current law (PR #1265). */
export const CUSTOM_BASELINE = { reformId: 'rf-plan-b', policyId: '88', label: 'Plan B' };

/** e0cee74a "Build: choose what the reform is compared with" (feat/v3-custom-baseline). */
export const metaWithBaseline = { ...metaWithBudgetWindow, baseline: CUSTOM_BASELINE };

/** A sparse unversioned stash: what the defaults are for. */
export const sparseMeta = {
  provisions: [{ path: CTC_PROVISION.path, value: 2500 }],
};

export const sparseMetaExpected: FlagshipReportMeta = {
  title: '',
  sourceNote: '',
  provisions: [
    // No baseline was stored, so none is made up.
    {
      path: CTC_PROVISION.path,
      breadcrumb: CTC_PROVISION.path,
      unit: null,
      baselineValue: undefined,
      value: 2500,
    },
  ],
  createdAt: '',
};

/** The current shape, as runFlagshipReport writes it. */
export const currentMeta: FlagshipReportMeta = {
  title: 'CTC to $2,500',
  sourceNote: 'Hand-built draft',
  provisions: [DATED_CTC_PROVISION, GROWING_PROVISION],
  createdAt: CREATED_AT,
  budgetWindow: { startYear: 2026, windowSize: 10 },
};

export const historicMeta: Array<[string, unknown, ReportMetaFields]> = [
  ['the run bridge', metaFromRunBridge, metaFromRunBridge],
  ['provisions with dated changes', metaWithIntervals, metaWithIntervals],
  ['a provision that grows', metaWithGrowth, metaWithGrowth],
  ['when and how it grows and rounds', metaWithGrowthTiming, metaWithGrowthTiming],
  ['a budget window', metaWithBudgetWindow, metaWithBudgetWindow],
  ['a custom baseline', metaWithBaseline, metaWithBaseline],
  [
    'a custom baseline without a saved reform',
    { ...metaWithBaseline, baseline: { policyId: '88', label: 'Plan B' } },
    { ...metaWithBaseline, baseline: { reformId: null, policyId: '88', label: 'Plan B' } },
  ],
];

/* Report records, stored under REPORTS_KEY by the localStorage fallback. */

/** 6c23805e "Beat 1 of storage unification": the first record, with the shared user id. */
export const recordFromStorageBeat = {
  id: LOCAL_REPORT_ID,
  userId: 'anonymous',
  countryId: 'us',
  apiReportId: API_REPORT_ID,
  title: 'CTC to $2,500',
  sourceNote: 'Hand-built draft',
  provisions: [CTC_PROVISION],
  year: '2026',
  createdAt: CREATED_AT,
};

/** b2a09635 "Adjust panel: … reform reconciliation": the saved reform it ran from. */
export const recordWithReformLink = { ...recordFromStorageBeat, reformId: SAVED_REFORM_ID };

/** f8294f90 "Pin what each report's validation was matched against". */
export const recordWithValidation = {
  ...recordWithReformLink,
  validation: mockReportValidationSnapshot,
};

/** ec399555 "Flagship: store reforms and reports without a user id". */
const { userId: _userId, ...recordWithoutUserIdFields } = recordWithValidation;
export const recordWithoutUserId = recordWithoutUserIdFields;

const recordBase: FlagshipReportRecord = {
  id: LOCAL_REPORT_ID,
  countryId: 'us',
  apiReportId: API_REPORT_ID,
  title: 'CTC to $2,500',
  sourceNote: 'Hand-built draft',
  provisions: [CTC_PROVISION],
  year: '2026',
  createdAt: CREATED_AT,
  reformId: null,
  validation: null,
  // Records saved before comparisons could be chosen read as current law.
  baselineReformId: null,
};

export const currentRecord: FlagshipReportRecord = {
  ...recordBase,
  reformId: SAVED_REFORM_ID,
  validation: mockReportValidationSnapshot,
};

export const historicRecords: Array<[string, unknown, FlagshipReportRecord]> = [
  ['the first record, with the shared user id', recordFromStorageBeat, recordBase],
  ['a reform link', recordWithReformLink, { ...recordBase, reformId: SAVED_REFORM_ID }],
  ['a validation pin', recordWithValidation, currentRecord],
  ['no user id', recordWithoutUserId, currentRecord],
];

/* Unreadable: [name, stored, error code, offending field]. */

export const malformedMeta: Array<[string, unknown, string, string | undefined]> = [
  ['a string', 'CTC to $2,500', 'not-an-object', undefined],
  ['an array', [metaFromRunBridge], 'not-an-object', undefined],
  ['null', null, 'not-an-object', undefined],
  ['no provisions', { title: 'CTC' }, 'invalid-field', 'provisions'],
  ['provisions as an object', { provisions: { 0: CTC_PROVISION } }, 'invalid-field', 'provisions'],
  [
    'a provision without a path',
    { provisions: [{ ...CTC_PROVISION, path: '' }] },
    'invalid-field',
    'provisions[0].path',
  ],
  ['a provision that is not an object', { provisions: [42] }, 'invalid-field', 'provisions[0]'],
  [
    'a numeric unit',
    { provisions: [{ ...CTC_PROVISION, unit: 7 }] },
    'invalid-field',
    'provisions[0].unit',
  ],
  [
    'a dated change without a start',
    {
      provisions: [{ ...CTC_PROVISION, intervals: [{ endDate: '2026-12-31', value: 2500 }] }],
    },
    'invalid-field',
    'provisions[0].intervals[0].startDate',
  ],
  [
    'a numeric growth',
    { provisions: [{ ...GROWING_PROVISION, growth: 0.03 }] },
    'invalid-field',
    'provisions[0].growth',
  ],
  [
    'a growth start as text',
    { provisions: [{ ...GROWING_PROVISION, growthStart: '2027' }] },
    'invalid-field',
    'provisions[0].growthStart',
  ],
  [
    'an unknown rounding',
    { provisions: [{ ...GROWING_PROVISION, growthRound: 'sideways' }] },
    'invalid-field',
    'provisions[0].growthRound',
  ],
  ['a numeric title', { ...metaFromRunBridge, title: 42 }, 'invalid-field', 'title'],
  [
    'a budget window of no years',
    { ...metaFromRunBridge, budgetWindow: { startYear: 2026, windowSize: 0 } },
    'invalid-field',
    'budgetWindow.windowSize',
  ],
  [
    'a baseline without its policy',
    { ...metaFromRunBridge, baseline: { reformId: null, label: 'Plan B' } },
    'invalid-field',
    'baseline.policyId',
  ],
  [
    'a baseline that is a name',
    { ...metaFromRunBridge, baseline: 'Plan B' },
    'invalid-field',
    'baseline',
  ],
  [
    'a text schema version',
    { ...metaFromRunBridge, schemaVersion: '2' },
    'invalid-field',
    'schemaVersion',
  ],
  [
    'a newer schema version',
    { ...metaFromRunBridge, schemaVersion: NEWER_SCHEMA_VERSION },
    'newer-version',
    'schemaVersion',
  ],
];

export const malformedRecords: Array<[string, unknown, string, string | undefined]> = [
  ['no id', { ...recordWithoutUserId, id: undefined }, 'invalid-field', 'id'],
  ['an unknown country', { ...recordWithoutUserId, countryId: 'fr' }, 'invalid-field', 'countryId'],
  ['no API report id', { ...recordWithoutUserId, apiReportId: '' }, 'invalid-field', 'apiReportId'],
  ['a numeric year', { ...recordWithoutUserId, year: 2026 }, 'invalid-field', 'year'],
  ['a numeric reform id', { ...recordWithoutUserId, reformId: 7 }, 'invalid-field', 'reformId'],
  [
    'a newer schema version',
    { ...recordWithoutUserId, schemaVersion: NEWER_SCHEMA_VERSION },
    'newer-version',
    'schemaVersion',
  ],
];

/** A record whose validation pin is damaged: the record still reads, without the pin. */
export const recordWithDamagedPin = {
  ...recordWithoutUserId,
  validation: { matchedAt: 7, calibration: 'release' },
};

/** A record a newer version of the app saved, with a field this one doesn't know. */
export const recordFromNewerVersion = {
  ...recordWithoutUserId,
  id: OTHER_LOCAL_REPORT_ID,
  schemaVersion: NEWER_SCHEMA_VERSION,
  futureField: { kept: true },
};

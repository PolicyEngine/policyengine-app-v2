import { beforeEach, describe, expect, test } from 'vitest';
import { readReportMeta, readReportMetaResult, saveReportMeta } from '@/libs/flagship/runReport';
import {
  CURRENT_SCHEMA_VERSION,
  currentMeta,
  CUSTOM_BASELINE,
  metaFromRunBridge,
  metaWithBudgetWindow,
  NEWER_SCHEMA_VERSION,
  REPORT_META_KEY,
} from '@/tests/fixtures/libs/flagship/reportSchemaMocks';

const REPORT_ID = '4512';
const OTHER_REPORT_ID = '4513';

function seedMeta(byReportId: Record<string, unknown>): void {
  localStorage.setItem(REPORT_META_KEY, JSON.stringify(byReportId));
}

function storedMeta(): Record<string, any> {
  return JSON.parse(localStorage.getItem(REPORT_META_KEY) ?? '{}');
}

describe('report provenance in localStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('given saved provenance then it is stamped with the current version', () => {
    saveReportMeta(REPORT_ID, currentMeta);

    expect(storedMeta()[REPORT_ID]).toEqual({
      ...currentMeta,
      schemaVersion: CURRENT_SCHEMA_VERSION,
    });
  });

  test('given saved provenance then it reads back unchanged', () => {
    saveReportMeta(REPORT_ID, currentMeta);

    expect(readReportMeta(REPORT_ID)).toEqual(currentMeta);
  });

  test('given provenance an older version stashed then it reads in the current shape', () => {
    seedMeta({ [REPORT_ID]: metaWithBudgetWindow });

    expect(readReportMeta(REPORT_ID)).toEqual(metaWithBudgetWindow);
  });

  test('given no provenance for the report then there is no result', () => {
    seedMeta({ [OTHER_REPORT_ID]: metaFromRunBridge });

    expect(readReportMetaResult(REPORT_ID)).toBeNull();
    expect(readReportMetaResult('constructor')).toBeNull();
  });

  test('given unreadable provenance then the result says why and the plain read is null', () => {
    seedMeta({ [REPORT_ID]: { ...metaFromRunBridge, provisions: 'oops' } });

    const result = readReportMetaResult(REPORT_ID);

    expect(result?.ok ? null : result?.error.field).toBe('provisions');
    expect(readReportMeta(REPORT_ID)).toBeNull();
  });

  test('given provenance a newer version saved then saving another keeps it as stored', () => {
    const newer = { ...metaFromRunBridge, schemaVersion: NEWER_SCHEMA_VERSION };
    seedMeta({ [OTHER_REPORT_ID]: newer });

    saveReportMeta(REPORT_ID, currentMeta);

    expect(storedMeta()[OTHER_REPORT_ID]).toEqual(newer);
  });

  test.each([
    ['a string', '4512'],
    ['a list', [metaFromRunBridge]],
    ['null', null],
  ])('given a stash that is %s then no report reads provenance from it', (_name, stash) => {
    localStorage.setItem(REPORT_META_KEY, JSON.stringify(stash));

    expect(readReportMetaResult('0')).toBeNull();
    expect(readReportMeta('0')).toBeNull();
  });

  test('given meta compared with a saved reform then the baseline reads back', () => {
    const compared = { ...currentMeta, baseline: CUSTOM_BASELINE };

    saveReportMeta(REPORT_ID, compared);

    expect(readReportMeta(REPORT_ID)).toEqual(compared);
  });
});

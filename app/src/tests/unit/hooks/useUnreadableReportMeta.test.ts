import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { useUnreadableReportMeta } from '@/hooks/useUnreadableReportMeta';
import { ReportSchemaError } from '@/libs/flagship/reportSchema';
import { readReportMeta } from '@/libs/flagship/runReport';
import {
  metaFromRunBridge,
  NEWER_SCHEMA_VERSION,
  REPORT_META_KEY,
} from '@/tests/fixtures/libs/flagship/reportSchemaMocks';

const REPORT_ID = '4512';
const OTHER_REPORT_ID = '4513';
const DAMAGED_META = { provisions: 'oops' };
const NEWER_META = { ...metaFromRunBridge, schemaVersion: NEWER_SCHEMA_VERSION };

function seedMeta(byReportId: Record<string, unknown>): void {
  localStorage.setItem(REPORT_META_KEY, JSON.stringify(byReportId));
}

function storedMeta(): Record<string, unknown> {
  return JSON.parse(localStorage.getItem(REPORT_META_KEY) ?? '{}');
}

describe('useUnreadableReportMeta', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('given readable provenance then there is no error', () => {
    seedMeta({ [REPORT_ID]: metaFromRunBridge });

    const { result } = renderHook(() => useUnreadableReportMeta(REPORT_ID));

    expect(result.current.error).toBeNull();
  });

  test('given no stored provenance then there is no error', () => {
    const { result } = renderHook(() => useUnreadableReportMeta(REPORT_ID));

    expect(result.current.error).toBeNull();
  });

  test('given unreadable provenance then the error says why, and the plain read is none', () => {
    seedMeta({ [REPORT_ID]: DAMAGED_META });

    const { result } = renderHook(() => useUnreadableReportMeta(REPORT_ID));

    expect(result.current.error).toBeInstanceOf(ReportSchemaError);
    expect(result.current.error?.field).toBe('provisions');
    expect(readReportMeta(REPORT_ID)).toBeNull();
  });

  test('given damaged provenance set aside then it is removed, and the next visit does not ask', () => {
    seedMeta({ [REPORT_ID]: DAMAGED_META, [OTHER_REPORT_ID]: metaFromRunBridge });
    const { result } = renderHook(() => useUnreadableReportMeta(REPORT_ID));

    act(() => result.current.setAside());

    expect(result.current.error).toBeNull();
    expect(storedMeta()).toEqual({ [OTHER_REPORT_ID]: metaFromRunBridge });
    expect(renderHook(() => useUnreadableReportMeta(REPORT_ID)).result.current.error).toBeNull();
  });

  test('given provenance a newer version saved set aside then it stays stored for that version', () => {
    seedMeta({ [REPORT_ID]: NEWER_META });
    const { result } = renderHook(() => useUnreadableReportMeta(REPORT_ID));

    act(() => result.current.setAside());

    expect(result.current.error).toBeNull();
    expect(storedMeta()[REPORT_ID]).toEqual(NEWER_META);
    expect(renderHook(() => useUnreadableReportMeta(REPORT_ID)).result.current.error?.code).toBe(
      'newer-version'
    );
  });

  test('given re-renders then the stored provenance is read once', () => {
    seedMeta({ [REPORT_ID]: DAMAGED_META });
    const getItem = vi.spyOn(localStorage, 'getItem');
    const { rerender } = renderHook(() => useUnreadableReportMeta(REPORT_ID));
    const reads = getItem.mock.calls.length;

    rerender();
    rerender();

    expect(getItem.mock.calls.length).toBe(reads);
    getItem.mockRestore();
  });

  test('given a set-aside report then another report still answers its own error', () => {
    seedMeta({ [REPORT_ID]: DAMAGED_META, [OTHER_REPORT_ID]: DAMAGED_META });
    const { result, rerender } = renderHook(({ id }) => useUnreadableReportMeta(id), {
      initialProps: { id: REPORT_ID },
    });

    act(() => result.current.setAside());
    rerender({ id: OTHER_REPORT_ID });

    expect(result.current.error).toBeInstanceOf(ReportSchemaError);
  });
});

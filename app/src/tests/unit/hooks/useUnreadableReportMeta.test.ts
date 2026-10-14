import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, test } from 'vitest';
import { useUnreadableReportMeta } from '@/hooks/useUnreadableReportMeta';
import { ReportSchemaError } from '@/libs/flagship/reportSchema';
import { readReportMeta } from '@/libs/flagship/runReport';
import {
  metaFromRunBridge,
  REPORT_META_KEY,
} from '@/tests/fixtures/libs/flagship/reportSchemaMocks';

const REPORT_ID = '4512';
const OTHER_REPORT_ID = '4513';
const DAMAGED_META = { provisions: 'oops' };

function seedMeta(byReportId: Record<string, unknown>): void {
  localStorage.setItem(REPORT_META_KEY, JSON.stringify(byReportId));
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

  test('given unreadable provenance set aside then there is no error, and it stays stored', () => {
    seedMeta({ [REPORT_ID]: DAMAGED_META });
    const { result } = renderHook(() => useUnreadableReportMeta(REPORT_ID));

    act(() => result.current.setAside());

    expect(result.current.error).toBeNull();
    expect(JSON.parse(localStorage.getItem(REPORT_META_KEY)!)[REPORT_ID]).toEqual(DAMAGED_META);
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

import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { LocalStorageFlagshipReportStore } from '@/api/flagshipReportStore';
import { useReportValidationSnapshot } from '@/hooks/useReportValidationSnapshot';
import type { LiveValidation } from '@/libs/flagship/reportValidation';
import { mockCalibrationMatches } from '@/tests/fixtures/libs/flagship/calibrationMatchingMocks';
import { NEWER_RELEASE_ID } from '@/tests/fixtures/libs/flagship/reportValidationMocks';

vi.mock('@/api/flagshipReportStore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/flagshipReportStore')>();
  return {
    ...actual,
    getFlagshipReportStore: () => new actual.LocalStorageFlagshipReportStore(),
  };
});

const USER_ID = 'user-123';
const API_REPORT_ID = '4512';

const settledLive: LiveValidation = {
  calibration: mockCalibrationMatches,
  programs: ['ctc_refund'],
};

async function createRecord() {
  return new LocalStorageFlagshipReportStore().create({
    userId: USER_ID,
    countryId: 'us',
    apiReportId: API_REPORT_ID,
    title: 'CTC to $2,500',
    sourceNote: null,
    provisions: [],
    year: '2026',
  });
}

describe('useReportValidationSnapshot', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('given a record and settled checks then the live validation is pinned once', async () => {
    const record = await createRecord();

    const { result, rerender } = renderHook(
      ({ live }: { live: LiveValidation }) =>
        useReportValidationSnapshot(USER_ID, API_REPORT_ID, live),
      { initialProps: { live: settledLive } }
    );

    await waitFor(() => expect(result.current.snapshot).not.toBeNull());
    expect(result.current.snapshot?.calibration?.releaseId).toBe(mockCalibrationMatches.releaseId);
    expect(result.current.drift).toEqual([]);

    const stored = await new LocalStorageFlagshipReportStore().findById(record.id);
    expect(stored?.validation?.scorecard).toEqual({ programs: ['ctc_refund'] });

    // A newer release arriving later is reported as drift, not re-pinned.
    rerender({
      live: {
        ...settledLive,
        calibration: { ...mockCalibrationMatches, releaseId: NEWER_RELEASE_ID },
      },
    });
    await waitFor(() => expect(result.current.drift).toHaveLength(1));
    const afterwards = await new LocalStorageFlagshipReportStore().findById(record.id);
    expect(afterwards?.validation?.calibration?.releaseId).toBe(mockCalibrationMatches.releaseId);
  });

  test('given checks still loading then nothing is pinned yet', async () => {
    const record = await createRecord();

    const { result } = renderHook(() =>
      useReportValidationSnapshot(USER_ID, API_REPORT_ID, { calibration: undefined, programs: [] })
    );

    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(result.current.snapshot).toBeNull();
    const stored = await new LocalStorageFlagshipReportStore().findById(record.id);
    expect(stored?.validation).toBeUndefined();
  });

  test('given no store record for the report then nothing is pinned', async () => {
    const { result } = renderHook(() =>
      useReportValidationSnapshot(USER_ID, API_REPORT_ID, settledLive)
    );

    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(result.current.snapshot).toBeNull();
  });
});

import { describe, expect, test } from 'vitest';
import {
  isLiveValidationSettled,
  snapshotFromLive,
  validationDrift,
  validationFromWire,
  validationToWire,
} from '@/libs/flagship/reportValidation';
import { mockCalibrationMatches } from '@/tests/fixtures/libs/flagship/calibrationMatchingMocks';
import {
  MATCHED_AT,
  mockReportValidationSnapshot,
  NEWER_MODEL_VERSION,
  NEWER_RELEASE_ID,
} from '@/tests/fixtures/libs/flagship/reportValidationMocks';

describe('isLiveValidationSettled', () => {
  test('given either check still loading then it is not settled', () => {
    expect(isLiveValidationSettled({ calibration: undefined, programs: ['ctc_refund'] })).toBe(
      false
    );
    expect(isLiveValidationSettled({ calibration: null, programs: undefined })).toBe(false);
  });

  test('given both checks resolved, even to unavailable, then it is settled', () => {
    expect(isLiveValidationSettled({ calibration: null, programs: [] })).toBe(true);
  });
});

describe('snapshotFromLive', () => {
  test('given live matches then the pin records release, model, fit, and programs', () => {
    const snapshot = snapshotFromLive(
      { calibration: mockCalibrationMatches, programs: ['ctc_refund'] },
      MATCHED_AT
    );

    expect(snapshot).toEqual(mockReportValidationSnapshot);
  });

  test('given the calibration check was unavailable then the pin says so', () => {
    const snapshot = snapshotFromLive({ calibration: null, programs: [] }, MATCHED_AT);

    expect(snapshot.calibration).toBeNull();
    expect(snapshot.mapModelVersion).toBe('');
  });
});

describe('validationDrift', () => {
  test('given the same release and model then there is no drift', () => {
    expect(
      validationDrift(mockReportValidationSnapshot, {
        calibration: mockCalibrationMatches,
        programs: ['ctc_refund'],
      })
    ).toEqual([]);
  });

  test('given a newer release and model then both are named with the pinned values', () => {
    const drift = validationDrift(mockReportValidationSnapshot, {
      calibration: {
        ...mockCalibrationMatches,
        releaseId: NEWER_RELEASE_ID,
        modelVersion: NEWER_MODEL_VERSION,
      },
      programs: ['ctc_refund'],
    });

    expect(drift).toHaveLength(2);
    expect(drift[0]).toContain(NEWER_RELEASE_ID);
    expect(drift[0]).toContain(mockReportValidationSnapshot.calibration!.releaseId);
    expect(drift[1]).toContain(NEWER_MODEL_VERSION);
  });

  test('given the live check is unavailable then nothing can be said about drift', () => {
    expect(
      validationDrift(mockReportValidationSnapshot, { calibration: null, programs: [] })
    ).toEqual([]);
  });
});

describe('wire format', () => {
  test('given a snapshot then it survives a round trip through the wire shape', () => {
    const wire = validationToWire(mockReportValidationSnapshot);

    expect(wire.calibration!.matches[0].mean_abs_relative_error).toBe(0.04);
    expect(validationFromWire(wire)).toEqual(mockReportValidationSnapshot);
  });

  test('given junk then no snapshot returns', () => {
    expect(validationFromWire(null)).toBeNull();
    expect(validationFromWire({ calibration: {} })).toBeNull();
  });
});

import type { ReportValidationSnapshot } from '@/libs/flagship/reportValidation';
import { mockCalibrationMatches, POPULACE_RELEASE_ID } from './calibrationMatchingMocks';

export const MATCHED_AT = '2026-09-07T00:30:00.000Z';
export const NEWER_RELEASE_ID = 'populace-us-2024-buildp-sparse-rmloss100-f1e2d3c-20260914T010000Z';
export const NEWER_MODEL_VERSION = '1.830.0';

/** The pin a CTC report carries after its first view. */
export const mockReportValidationSnapshot: ReportValidationSnapshot = {
  matchedAt: MATCHED_AT,
  mapModelVersion: mockCalibrationMatches.modelVersion,
  calibration: {
    releaseId: POPULACE_RELEASE_ID,
    geography: 'US',
    reachedCount: mockCalibrationMatches.reachedCount,
    matches: mockCalibrationMatches.matches.map((match) => ({
      variable: match.variable,
      depth: match.depth,
      ring: match.ring,
      targetCount: match.targetCount,
      meanAbsRelativeError: match.meanAbsRelativeError,
      worst: {
        name: match.worst.name,
        source: match.worst.source,
        geography: match.worst.geography,
        relativeError: match.worst.relativeError,
      },
    })),
  },
  scorecard: { programs: ['ctc_refund'] },
};

import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  calibrationMatchesForPaths,
  fetchCalibrationTargets,
  geographyForRegion,
  ringForDepth,
  summarizeMatches,
  weightedMeanAbsError,
} from '@/libs/flagship/calibrationMatching';
import {
  mockCalibrationRows,
  POPULACE_RELEASE_ID,
} from '@/tests/fixtures/libs/flagship/calibrationMatchingMocks';
import {
  CTC_BASE_AMOUNT_PATH,
  mockParameterDependencyMap,
  STANDARD_DEDUCTION_PATH,
} from '@/tests/fixtures/libs/flagship/parameterDependenciesMocks';

vi.mock('@/libs/flagship/parameterDependencies', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/libs/flagship/parameterDependencies')>();
  const { mockParameterDependencyMap } =
    await import('@/tests/fixtures/libs/flagship/parameterDependenciesMocks');
  return {
    ...original,
    loadParameterDependencies: vi.fn(async () => mockParameterDependencyMap),
  };
});

const okResponse = (body: unknown) => ({ ok: true, json: async () => body }) as unknown as Response;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('geographyForRegion', () => {
  test('given the country region then the national geography returns', () => {
    expect(geographyForRegion('us')).toBe('US');
  });

  test('given a state region then the state code returns', () => {
    expect(geographyForRegion('state/ca')).toBe('CA');
  });

  test('given no region then the national geography returns', () => {
    expect(geographyForRegion(undefined)).toBe('US');
  });
});

describe('ringForDepth', () => {
  test('given depths then rings follow the primary, mechanism, downstream cut', () => {
    expect([0, 1, 2, 4, 5].map(ringForDepth)).toEqual([
      'primary',
      'primary',
      'mechanism',
      'mechanism',
      'downstream',
    ]);
  });
});

describe('summarizeMatches', () => {
  test('given reached variables then targets group under them, worst first, nearest first', () => {
    const matches = summarizeMatches(
      [
        { variable: 'ctc', depth: 3, via: 'ctc_maximum' },
        { variable: 'refundable_ctc', depth: 2, via: 'ctc_refundable_maximum' },
        { variable: 'ctc_maximum', depth: 2, via: 'ctc_individual_maximum' },
      ],
      mockCalibrationRows
    );

    expect(matches.map((m) => m.variable)).toEqual(['refundable_ctc', 'ctc']);
    expect(matches[0]).toMatchObject({
      depth: 2,
      ring: 'mechanism',
      targetCount: 2,
      meanAbsRelativeError: 0.04,
    });
    expect(matches[0].worst.relativeError).toBe(-0.06);
  });

  test('given targets of different sizes then the mean error is weighted by target size', () => {
    const big = { ...mockCalibrationRows[0], target: 9_000_000, relativeError: 0.01 };
    const tiny = { ...mockCalibrationRows[1], target: 1_000_000, relativeError: 0.91 };

    expect(weightedMeanAbsError([big, tiny])).toBeCloseTo(0.1, 5);
  });

  test('given rows without a relative error then they are ignored', () => {
    const matches = summarizeMatches(
      [{ variable: 'ctc', depth: 0, via: 'gov.x' }],
      [{ ...mockCalibrationRows[2], relativeError: null }]
    );

    expect(matches).toEqual([]);
  });
});

describe('fetchCalibrationTargets', () => {
  test('given variables then the route is posted the variables and geography', async () => {
    const fetchMock = vi.fn(async () =>
      okResponse({ releaseId: POPULACE_RELEASE_ID, rows: mockCalibrationRows })
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchCalibrationTargets(['ctc', 'refundable_ctc'], 'CA');

    expect(fetchMock).toHaveBeenCalledWith('/api/calibration-targets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ variables: ['ctc', 'refundable_ctc'], geography: 'CA' }),
    });
    expect(result).toEqual({ releaseId: POPULACE_RELEASE_ID, rows: mockCalibrationRows });
  });

  test('given no variables then nothing is fetched', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchCalibrationTargets([], 'US')).resolves.toEqual({
      releaseId: null,
      rows: [],
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('given the route fails then null returns', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false }) as Response)
    );

    await expect(fetchCalibrationTargets(['ctc'], 'US')).resolves.toBeNull();
  });
});

describe('calibrationMatchesForPaths', () => {
  test('given a CTC path then the reached calibrated variables come back with the release', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => okResponse({ releaseId: POPULACE_RELEASE_ID, rows: mockCalibrationRows }))
    );

    const result = await calibrationMatchesForPaths([CTC_BASE_AMOUNT_PATH], 'US');

    expect(result).toMatchObject({
      releaseId: POPULACE_RELEASE_ID,
      geography: 'US',
      modelVersion: mockParameterDependencyMap.model.version,
    });
    expect(result!.matches.map((m) => [m.variable, m.depth])).toEqual([
      ['ctc', 3],
      ['refundable_ctc', 3],
    ]);
  });

  test('given a path reaching nothing calibrated then matches are empty', async () => {
    const fetchMock = vi.fn(async () => okResponse({ releaseId: POPULACE_RELEASE_ID, rows: [] }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await calibrationMatchesForPaths([STANDARD_DEDUCTION_PATH], 'US');

    expect(result!.matches).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

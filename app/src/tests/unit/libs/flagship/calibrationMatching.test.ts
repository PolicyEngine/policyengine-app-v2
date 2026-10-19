import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  calibrationFitForGeography,
  calibrationMatchesForPaths,
  calibrationTargetLabel,
  calibrationVariableLabel,
  dashboardTargetsUrl,
  fetchCalibrationTargets,
  fetchGeographyCalibrationTargets,
  geographyForRegion,
  relevantCalibrationMatches,
  ringForDepth,
  summarizeGeographyFit,
  summarizeMatches,
  weightedMeanAbsError,
} from '@/libs/flagship/calibrationMatching';
import {
  mockCalibrationMatches,
  mockCalibrationRows,
  mockCtcLimitingMatch,
  mockDcFitRows,
  mockEitcCalibrationRow,
  POPULACE_RELEASE_ID,
} from '@/tests/fixtures/libs/flagship/calibrationMatchingMocks';
import {
  NATIONWIDE,
  REPORT_4332_REFORM,
  usReform,
} from '@/tests/fixtures/libs/flagship/comparisonRelevanceMocks';
import {
  CTC_BASE_AMOUNT_PATH,
  EITC_MAX_PATH,
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

describe('dashboardTargetsUrl', () => {
  test('given a source and level then the targets page is filtered by both', () => {
    expect(dashboardTargetsUrl({ source: 'usda_snap', level: 'state' })).toBe(
      'https://calibration-diagnostics.vercel.app/calibration/dashboard/microcosm/targets?source=usda_snap&level=state'
    );
  });

  test('given no filters then the bare targets page returns', () => {
    expect(dashboardTargetsUrl({})).toBe(
      'https://calibration-diagnostics.vercel.app/calibration/dashboard/microcosm/targets'
    );
  });

  test('given a state then the targets page is filtered to it', () => {
    expect(dashboardTargetsUrl({ level: 'state', geography: 'DC' })).toBe(
      'https://calibration-diagnostics.vercel.app/calibration/dashboard/microcosm/targets?level=state&geography=DC'
    );
  });
});

describe('fetchGeographyCalibrationTargets', () => {
  test('given a state then the route is asked for all its targets', async () => {
    const fetchMock = vi.fn(async () =>
      okResponse({ releaseId: POPULACE_RELEASE_ID, rows: mockDcFitRows })
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchGeographyCalibrationTargets('DC');

    expect(fetchMock).toHaveBeenCalledWith('/api/calibration-targets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ variables: [], geography: 'DC', all: true }),
    });
    expect(result).toEqual({ releaseId: POPULACE_RELEASE_ID, rows: mockDcFitRows });
  });

  test('given the route fails then null returns', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false }) as Response)
    );

    await expect(calibrationFitForGeography('DC')).resolves.toBeNull();
  });
});

describe('summarizeGeographyFit', () => {
  test('given a state’s targets then it counts them, the close fits, the weighted gap and the worst', () => {
    const fit = summarizeGeographyFit('DC', POPULACE_RELEASE_ID, [...mockDcFitRows].reverse(), 3);

    expect(fit.targetCount).toBe(5);
    // DC income tax (6.5%), returns (2%) and population (0.1%) are within 10%.
    expect(fit.closeFitShare).toBeCloseTo(3 / 5);
    expect(fit.meanAbsRelativeError).toBeCloseTo(weightedMeanAbsError(mockDcFitRows));
    expect(fit.worst).toEqual(mockDcFitRows.slice(0, 3));
  });

  test('given targets of other places or without a fit then they are left out', () => {
    const fit = summarizeGeographyFit('DC', null, [
      ...mockCalibrationRows,
      { ...mockDcFitRows[0], relativeError: null },
    ]);

    expect(fit).toEqual({
      releaseId: null,
      geography: 'DC',
      targetCount: 0,
      closeFitShare: 0,
      meanAbsRelativeError: 0,
      worst: [],
    });
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

  test('given an EITC path echoing into the CTC then only the EITC targets remain', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        okResponse({
          releaseId: POPULACE_RELEASE_ID,
          rows: [...mockCalibrationRows, mockEitcCalibrationRow],
        })
      )
    );

    const result = await calibrationMatchesForPaths([EITC_MAX_PATH], 'US');

    expect(result!.reachedCount).toBeGreaterThan(1);
    expect(result!.matches.map((match) => match.variable)).toEqual(['eitc']);
    // The CTC targets it echoes into are kept as related context, not as matches.
    expect(result!.related!.length).toBeGreaterThan(0);
    expect(result!.related!.map((match) => match.variable)).not.toContain('eitc');
  });
});

describe('relevantCalibrationMatches', () => {
  test('given report 4332 then its CTC targets drop and no match is left', () => {
    expect(
      relevantCalibrationMatches(
        [...mockCalibrationMatches.matches, mockCtcLimitingMatch],
        REPORT_4332_REFORM
      )
    ).toEqual([]);
  });

  test('given a CTC reform then its CTC targets stay with their fit', () => {
    const [refundable] = relevantCalibrationMatches(
      mockCalibrationMatches.matches,
      usReform([CTC_BASE_AMOUNT_PATH], NATIONWIDE)
    );

    expect(refundable.variable).toBe('refundable_ctc');
    expect(refundable.targetCount).toBe(2);
    expect(refundable.worst).toBe(mockCalibrationRows[1]);
  });

  test('given a group with targets of another program then only the changed program stays', () => {
    const [match] = relevantCalibrationMatches(
      [
        {
          ...mockCalibrationMatches.matches[0],
          targets: [mockCalibrationRows[2], mockEitcCalibrationRow],
          targetCount: 2,
          worst: mockCalibrationRows[2],
        },
      ],
      usReform([EITC_MAX_PATH], NATIONWIDE)
    );

    expect(match.targets).toEqual([mockEitcCalibrationRow]);
    expect(match.worst).toBe(mockEitcCalibrationRow);
    expect(match.meanAbsRelativeError).toBeCloseTo(0.08);
  });
});

describe('calibrationTargetLabel', () => {
  test('given a measure id and a whole-table slice then the quantity names the target', () => {
    expect(calibrationTargetLabel(mockCalibrationRows[0])).toBe('Amount');
    expect(calibrationTargetLabel(mockCalibrationRows[1])).toBe('Returns');
  });

  test('given a slice of the table then the slice follows the quantity', () => {
    expect(calibrationTargetLabel(mockEitcCalibrationRow)).toBe(
      'Returns · 18k to 19k · no qualifying children'
    );
  });

  test('given a measure id without a quantity word then it reads as words', () => {
    expect(
      calibrationTargetLabel({
        ...mockCalibrationRows[0],
        sourceMeasureId: 'average_monthly_households',
        breakdown: '',
      })
    ).toBe('Average monthly households');
  });

  test('given no measure id then the measure names the target', () => {
    expect(
      calibrationTargetLabel({
        ...mockCalibrationRows[0],
        sourceMeasureId: null,
        breakdown: null,
        measure: 'count',
      })
    ).toBe('Count');
  });
});

describe('calibrationVariableLabel', () => {
  test('given our own copy then it wins over the model label', () => {
    expect(calibrationVariableLabel('refundable_ctc', 'refundable CTC')).toBe(
      'Refundable Child Tax Credit'
    );
  });

  test('given the model label then it names the variable', () => {
    expect(
      calibrationVariableLabel('ctc_limiting_tax_liability', 'CTC-limiting tax liability')
    ).toBe('CTC-limiting tax liability');
    expect(calibrationVariableLabel('snap', 'SNAP allotment')).toBe('SNAP allotment');
  });

  test('given no label then the name reads as words with its acronyms', () => {
    expect(calibrationVariableLabel('ctc_limiting_tax_liability')).toBe(
      'CTC limiting tax liability'
    );
  });
});

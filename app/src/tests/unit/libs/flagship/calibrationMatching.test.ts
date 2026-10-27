import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  calibrationFitForGeography,
  calibrationMatchesForPaths,
  calibrationPreviewTargets,
  calibrationTargetLabel,
  calibrationValueKind,
  calibrationVariableLabel,
  dashboardTargetsUrl,
  fetchCalibrationTargets,
  fetchGeographyCalibrationTargets,
  formatCalibrationValue,
  geographyForRegion,
  relevantCalibrationMatches,
  ringForDepth,
  summarizeGeographyFit,
  summarizeMatches,
  ukCalibrationGeographies,
  ukCalibrationMatchesForPaths,
  weightedMeanAbsError,
} from '@/libs/flagship/calibrationMatching';
import {
  mockCalibrationMatches,
  mockCalibrationRows,
  mockCtcLimitingMatch,
  mockDcFitRows,
  mockEitcCalibrationRow,
  POPULACE_RELEASE_ID,
  UC_BAND_ROWS,
  UC_HOUSEHOLDS_ROW,
  UC_SPENDING_ROW,
  UC_TARGETS_BY_GAP,
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
import {
  mockGbCarersAllowanceRow,
  mockScotlandHigherRateRow,
  mockUkItlRow,
  mockWalesIncomeTaxRow,
  UK_BASIC_RATE_PATH,
  UK_CARERS_EARNINGS_LIMIT_PATH,
  UK_ELASTICITY_PATH,
  UK_RELEASE_ID,
  UK_RELIEF_AGE_PATH,
} from '@/tests/fixtures/libs/flagship/ukCalibrationMocks';

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

describe('calibrationPreviewTargets', () => {
  test('given a programme sorted by gap then its spending and caseload lead, then the largest gaps', () => {
    // When
    const { ordered, previewCount } = calibrationPreviewTargets(UC_TARGETS_BY_GAP);

    // Then
    expect(previewCount).toBe(6);
    expect(ordered.slice(0, previewCount)).toEqual([
      UC_SPENDING_ROW,
      UC_HOUSEHOLDS_ROW,
      ...UC_BAND_ROWS.slice(0, 4),
    ]);
    expect(ordered).toHaveLength(UC_TARGETS_BY_GAP.length);
  });

  test('given fewer targets than the preview then all show', () => {
    // When
    const { ordered, previewCount } = calibrationPreviewTargets([UC_HOUSEHOLDS_ROW]);

    // Then
    expect(ordered).toEqual([UC_HOUSEHOLDS_ROW]);
    expect(previewCount).toBe(1);
  });
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

  test('given only a level then the targets page is filtered to it', () => {
    expect(dashboardTargetsUrl({ level: 'state' })).toBe(
      'https://calibration-diagnostics.vercel.app/calibration/dashboard/microcosm/targets?level=state'
    );
  });
});

describe('formatCalibrationValue', () => {
  test('given a total target then its values read as dollars', () => {
    expect(formatCalibrationValue(3_048_229_000, { measure: 'total' })).toBe('$3B');
    expect(formatCalibrationValue(3_245_012_820, { measure: 'total' })).toBe('$3.2B');
    expect(formatCalibrationValue(279_800_000, { measure: 'total' })).toBe('$279.8M');
    expect(formatCalibrationValue(3_212_345.678, { measure: 'total' }, 'exact')).toBe(
      '$3,212,345.68'
    );
  });

  test('given a count target then its values stay counts', () => {
    expect(formatCalibrationValue(20_600, { measure: 'count' })).toBe('20.6K');
    expect(formatCalibrationValue(20_601, { measure: 'count' }, 'exact')).toBe('20,601');
  });

  test('given no measure or no value then a plain number or a dash returns', () => {
    expect(calibrationValueKind({ measure: null })).toBe('number');
    expect(formatCalibrationValue(1_500, { measure: null })).toBe('1.5K');
    expect(formatCalibrationValue(null, { measure: 'total' })).toBe('—');
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

describe('UK calibration matching', () => {
  test('given UK report regions then the dashboard’s area names return', () => {
    expect(geographyForRegion('uk', 'uk')).toBe('United Kingdom');
    expect(geographyForRegion(undefined, 'uk')).toBe('United Kingdom');
    expect(geographyForRegion('country/wales', 'uk')).toBe('Wales');
    expect(geographyForRegion('country/england', 'uk')).toBe('England');
    expect(geographyForRegion('country/scotland', 'uk')).toBe('Scotland');
    expect(geographyForRegion('country/northern_ireland', 'uk')).toBe('Northern Ireland');
    expect(geographyForRegion('country/ni', 'uk')).toBe('Northern Ireland');
    expect(geographyForRegion('wales', 'uk')).toBe('Wales');
  });

  test('given a constituency or local authority then the UK returns, its nation unknown', () => {
    expect(geographyForRegion('constituency/Cardiff West', 'uk')).toBe('United Kingdom');
    expect(geographyForRegion('local_authority/Cardiff', 'uk')).toBe('United Kingdom');
  });

  test('given a US region without a country then the US reading is unchanged', () => {
    expect(geographyForRegion('country/wales')).toBe('US');
    expect(geographyForRegion('state/ca', 'us')).toBe('CA');
  });

  test('given a nation then its targets and the wider areas that contain it are read', () => {
    expect(ukCalibrationGeographies('Wales')).toEqual([
      'Wales',
      'England and Wales',
      'Great Britain',
      'United Kingdom',
    ]);
    expect(ukCalibrationGeographies('Scotland')).toEqual([
      'Scotland',
      'Great Britain',
      'United Kingdom',
    ]);
    expect(ukCalibrationGeographies('Northern Ireland')).toEqual([
      'Northern Ireland',
      'United Kingdom',
    ]);
    expect(ukCalibrationGeographies('United Kingdom')).toEqual([
      'United Kingdom',
      'Great Britain',
      'England and Wales',
    ]);
  });

  test('given the UK then the dashboard link opens its UK view', () => {
    expect(dashboardTargetsUrl({ source: 'hmrc', level: 'country', country: 'uk' })).toBe(
      'https://calibration-diagnostics.vercel.app/calibration/dashboard/microcosm/targets?country=uk&source=hmrc&level=country'
    );
    expect(dashboardTargetsUrl({ level: 'state', country: 'us' })).toBe(
      'https://calibration-diagnostics.vercel.app/calibration/dashboard/microcosm/targets?level=state'
    );
  });

  test('given a sterling target then its values read as pounds', () => {
    expect(formatCalibrationValue(3_245_012_820, mockUkItlRow)).toBe('£3.2B');
    expect(formatCalibrationValue(1_000_000, mockUkItlRow, 'exact')).toBe('£1,000,000');
    expect(formatCalibrationValue(20_600, mockScotlandHigherRateRow)).toBe('20.6K');
  });

  test('given a UK target then its label is the dashboard’s, with the band when the label names none', () => {
    expect(calibrationTargetLabel(mockWalesIncomeTaxRow)).toBe(
      'Income Tax liabilities by region, total income 50,000 to 70,000'
    );
    expect(calibrationTargetLabel(mockUkItlRow)).toBe(
      'Income Tax liabilities by total income band · Total income from GBP 200 000 to GBP 500 000'
    );
    expect(calibrationTargetLabel(mockGbCarersAllowanceRow)).toBe('Carers allowance');
  });

  test('report 4684: a basic-rate change in Wales matches Wales’s and the UK’s Income Tax targets', async () => {
    const fetchMock = vi.fn(async () =>
      okResponse({
        releaseId: UK_RELEASE_ID,
        // As the route answers: the asked geographies' targets of the asked programmes.
        rows: [mockUkItlRow, mockWalesIncomeTaxRow],
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await ukCalibrationMatchesForPaths([UK_BASIC_RATE_PATH], 'Wales');

    expect(fetchMock).toHaveBeenCalledWith('/api/calibration-targets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        variables: ['income_tax'],
        geography: 'Wales',
        country: 'uk',
        geographies: ['Wales', 'England and Wales', 'Great Britain', 'United Kingdom'],
      }),
    });
    expect(result).toMatchObject({
      releaseId: UK_RELEASE_ID,
      geography: 'Wales',
      countryId: 'uk',
      reachedCount: 1,
      related: [],
    });
    expect(result!.matches.map((match) => match.variable)).toEqual(['income_tax']);
    // Wales first, then the UK, whatever the fit.
    expect(result!.matches[0].targets).toEqual([mockWalesIncomeTaxRow, mockUkItlRow]);
  });

  test('report 4686: a UK-wide change matches Carer’s Allowance and Income Tax', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        okResponse({ releaseId: UK_RELEASE_ID, rows: [mockUkItlRow, mockGbCarersAllowanceRow] })
      )
    );

    const result = await ukCalibrationMatchesForPaths(
      [UK_CARERS_EARNINGS_LIMIT_PATH, UK_RELIEF_AGE_PATH],
      'United Kingdom'
    );

    expect(result!.matches.map((match) => match.variable).sort()).toEqual([
      'carers_allowance',
      'income_tax',
    ]);
  });

  test('given a parameter no programme covers then nothing is fetched and nothing matches', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const result = await ukCalibrationMatchesForPaths([UK_ELASTICITY_PATH], 'United Kingdom');

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result).toMatchObject({ reachedCount: 0, matches: [], countryId: 'uk' });
  });

  test('given the route fails then null returns', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false }) as Response)
    );

    await expect(ukCalibrationMatchesForPaths([UK_BASIC_RATE_PATH], 'Wales')).resolves.toBeNull();
  });

  test('given a nation then its overall fit is asked of the UK dashboard', async () => {
    const fetchMock = vi.fn(async () =>
      okResponse({ releaseId: UK_RELEASE_ID, rows: [mockWalesIncomeTaxRow] })
    );
    vi.stubGlobal('fetch', fetchMock);

    const fit = await calibrationFitForGeography('Wales', 'uk');

    expect(fetchMock).toHaveBeenCalledWith('/api/calibration-targets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ variables: [], geography: 'Wales', all: true, country: 'uk' }),
    });
    expect(fit).toMatchObject({ geography: 'Wales', targetCount: 1 });
  });
});

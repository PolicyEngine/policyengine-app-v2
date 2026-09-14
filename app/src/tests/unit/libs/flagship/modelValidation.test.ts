import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  claimsFromBillValidation,
  fetchModelValidation,
  scorecardMatchesForPaths,
  summarizeScorecardPrograms,
} from '@/libs/flagship/modelValidation';
import {
  mockEitcScorecardRows,
  mockScorecardRows,
} from '@/tests/fixtures/libs/flagship/modelValidationMocks';
import {
  CA_EITC_PATH,
  CTC_BASE_AMOUNT_PATH,
  EITC_MAX_PATH,
  SALT_CAP_PATH,
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

describe('summarizeScorecardPrograms', () => {
  test('given reached variables then programs group nearest first with their ring', () => {
    const { programs, rows } = summarizeScorecardPrograms(
      [
        { variable: 'eitc_maximum', depth: 0, via: EITC_MAX_PATH },
        { variable: 'eitc', depth: 1, via: 'eitc_maximum' },
        { variable: 'refundable_ctc', depth: 3, via: 'ctc_limiting_tax_liability' },
      ],
      mockScorecardRows
    );

    expect(programs).toEqual([
      { program: 'eitc', variable: 'eitc', depth: 1, ring: 'primary' },
      { program: 'ctc_refund', variable: 'refundable_ctc', depth: 3, ring: 'mechanism' },
    ]);
    expect(rows.map((row) => `${row.program}:${row.metric}`)).toEqual([
      'eitc:eligible_count',
      'ctc_refund:eligible_count',
      'ctc_refund:eligibility_rate',
    ]);
  });

  test('given a program computed from several reached variables then the nearest sets its depth', () => {
    const { programs } = summarizeScorecardPrograms(
      [
        { variable: 'is_snap_eligible', depth: 4, via: 'snap_gross_income' },
        { variable: 'snap', depth: 6, via: 'snap_normal_allotment' },
      ],
      mockScorecardRows
    );

    expect(programs).toEqual([
      { program: 'snap', variable: 'is_snap_eligible', depth: 4, ring: 'mechanism' },
    ]);
  });

  test('given rows computed from variables the reform does not reach then they drop', () => {
    const { programs, rows } = summarizeScorecardPrograms(
      [{ variable: 'salt_deduction', depth: 1, via: 'salt_cap' }],
      mockScorecardRows
    );

    expect(programs).toEqual([]);
    expect(rows).toEqual([]);
  });
});

describe('fetchModelValidation', () => {
  test('given variables then the route is asked for rows computed from them', async () => {
    const fetchMock = vi.fn(async () => okResponse({ rows: mockEitcScorecardRows }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchModelValidation(['eitc', 'refundable_ctc'])).resolves.toEqual(
      mockEitcScorecardRows
    );
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/model-validation',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ variables: ['eitc', 'refundable_ctc'] }),
      })
    );
  });

  test('given no variables then nothing is fetched', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchModelValidation([])).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('given the route fails then null returns', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false }) as Response)
    );

    await expect(fetchModelValidation(['eitc'])).resolves.toBeNull();
  });
});

describe('scorecardMatchesForPaths', () => {
  test('given a CTC path then only the refundable CTC is its program', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => okResponse({ rows: mockScorecardRows.slice(0, 2) }))
    );

    const matches = await scorecardMatchesForPaths([CTC_BASE_AMOUNT_PATH]);

    expect(matches?.modelVersion).toBe('1.808.0');
    expect(matches?.reachedCount).toBeGreaterThan(0);
    expect(matches?.programs).toEqual([
      { program: 'ctc_refund', variable: 'refundable_ctc', depth: 3, ring: 'mechanism' },
    ]);
    expect(matches?.rows).toHaveLength(2);
  });

  test('given an EITC path echoing into the refundable CTC then both show, EITC nearest', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => okResponse({ rows: mockEitcScorecardRows }))
    );

    const matches = await scorecardMatchesForPaths([EITC_MAX_PATH]);

    expect(matches?.programs.map((match) => [match.program, match.ring])).toEqual([
      ['eitc', 'primary'],
      ['ctc_refund', 'mechanism'],
    ]);
  });

  test('given a state credit then no federal program is borrowed', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => okResponse({ rows: [] }))
    );

    const matches = await scorecardMatchesForPaths([CA_EITC_PATH]);

    expect(matches?.reachedCount).toBeGreaterThan(0);
    expect(matches?.programs).toEqual([]);
  });

  test('given a path the map does not know then nothing is reached and nothing is fetched', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const matches = await scorecardMatchesForPaths(['gov.irs.income.bracket.rates.7']);

    expect(matches).toEqual({ modelVersion: '1.808.0', reachedCount: 0, programs: [], rows: [] });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('given the scorecard is unavailable then null returns', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false }) as Response)
    );

    await expect(scorecardMatchesForPaths([SALT_CAP_PATH])).resolves.toBeNull();
  });
});

describe('claimsFromBillValidation', () => {
  test('given tracker validation then scorecard-shaped claims return', () => {
    const claims = claimsFromBillValidation('ga-hb1001', {
      fiscalNoteEstimate: -800_000_000,
      fiscalNoteUrl: 'https://opb.georgia.gov/note',
      peEstimate: -800_583_615,
      discrepancyExplanation: 'Baseline rate mismatch.',
      externalAnalyses: [{ source: 'GBPI', url: 'https://gbpi.org/x', estimate: -750_000_000 }],
    });

    expect(claims).toHaveLength(2);
    expect(claims[0]).toMatchObject({
      source: 'Official fiscal note',
      policy: 'ga-hb1001',
      metric: 'budgetary_impact',
      externalValue: -800_000_000,
      peValue: -800_583_615,
      notes: 'Baseline rate mismatch.',
    });
    expect(claims[0].ratio).toBeCloseTo(1.0007, 3);
    expect(claims[1].source).toBe('GBPI');
  });

  test('given no comparable estimates then no claims return', () => {
    expect(claimsFromBillValidation('x', { peEstimate: -5 })).toEqual([]);
  });
});

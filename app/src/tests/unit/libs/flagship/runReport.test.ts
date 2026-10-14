import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { FlagshipReportRecord, FlagshipReportStore } from '@/api/flagshipReportStore';
import {
  forgetAccountReportMeta,
  readReportMeta,
  REPORT_META_KEY,
  reportMetaFromRecord,
  runFlagshipReport,
} from '@/libs/flagship/runReport';

const mockCreatePolicy = vi.fn();
const mockCreateSimulation = vi.fn();
const mockCreateReport = vi.fn();
const mockFetchBudgetWindow = vi.fn();
const mockFetchSocietyWide = vi.fn();

vi.mock('@/api/policy', () => ({
  createPolicy: (...args: any[]) => mockCreatePolicy(...args),
}));
vi.mock('@/api/simulation', () => ({
  createSimulation: (...args: any[]) => mockCreateSimulation(...args),
}));
vi.mock('@/api/report', () => ({
  createReport: (...args: any[]) => mockCreateReport(...args),
}));
vi.mock('@/api/budgetWindow', () => ({
  fetchBudgetWindow: (...args: any[]) => mockFetchBudgetWindow(...args),
}));
vi.mock('@/api/societyWideCalculation', () => ({
  fetchSocietyWideCalculation: (...args: any[]) => mockFetchSocietyWide(...args),
}));

/** The localStorage keys the legacy calculator keeps its saved work under. */
const LEGACY_KEYS = [
  'user-policy-associations',
  'user-population-households',
  'user-simulation-associations',
  'user-report-associations',
];

const REFORM_ROW_ID = '55555555-5555-4555-8555-555555555555';

const PROVISION = {
  path: 'gov.irs.credits.ctc.amount.base[0].amount',
  breadcrumb: 'IRS → Credits → Child tax credit → Base amount',
  unit: 'currency-USD',
  baselineValue: 2000,
  value: 2500,
};

describe('runFlagshipReport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockCreatePolicy.mockResolvedValue({ result: { policy_id: '77' } });
    mockCreateSimulation
      .mockResolvedValueOnce({ result: { simulation_id: '101' } })
      .mockResolvedValueOnce({ result: { simulation_id: '102' } });
    mockCreateReport.mockResolvedValue({ id: 55, country_id: 'us', year: '2026' });
  });

  test('starts both simulations before either finishes and waits for both before creating the report', async () => {
    let resolveBaseline!: (value: any) => void;
    let resolveReform!: (value: any) => void;
    mockCreateSimulation.mockReset();
    mockCreateSimulation
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveBaseline = resolve;
        })
      )
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveReform = resolve;
        })
      );
    const pending = runFlagshipReport({
      countryId: 'us',
      title: 'CTC',
      sourceNote: '',
      provisions: [PROVISION],
      currentLawId: 2,
    });
    await vi.waitFor(() => expect(mockCreateSimulation).toHaveBeenCalledTimes(2));
    expect(mockCreateReport).not.toHaveBeenCalled();
    resolveReform({ result: { simulation_id: '102' } });
    await Promise.resolve();
    expect(mockCreateReport).not.toHaveBeenCalled();
    resolveBaseline({ result: { simulation_id: '101' } });
    await expect(pending).resolves.toBe('55');
  });

  test('given provisions then policy, both simulations, and report are created in order', async () => {
    const userReportId = await runFlagshipReport({
      countryId: 'us',
      title: 'CTC expansion',
      sourceNote: 'Federal · Introduced',
      provisions: [PROVISION],
      currentLawId: 2,
    });

    expect(userReportId).toBe('55');
    // The base policy carries only the changes; the title stays on the record.
    expect(mockCreatePolicy).toHaveBeenCalledWith('us', {
      data: {
        'gov.irs.credits.ctc.amount.base[0].amount': { '2026-01-01.2100-12-31': 2500 },
      },
    });
    expect(mockCreateSimulation).toHaveBeenNthCalledWith(1, 'us', {
      population_id: 'us',
      population_type: 'geography',
      policy_id: 2,
    });
    expect(mockCreateSimulation).toHaveBeenNthCalledWith(2, 'us', {
      population_id: 'us',
      population_type: 'geography',
      policy_id: 77,
    });
    expect(mockCreateReport).toHaveBeenCalledWith('us', {
      simulation_1_id: 101,
      simulation_2_id: 102,
      year: '2026',
    });
  });

  test('given a state or district then both simulations run on it', async () => {
    await runFlagshipReport({
      countryId: 'us',
      title: 'CTC expansion',
      sourceNote: '',
      provisions: [PROVISION],
      currentLawId: 2,
      region: 'congressional_district/CA-01',
    });

    expect(mockCreateSimulation).toHaveBeenNthCalledWith(1, 'us', {
      population_id: 'congressional_district/CA-01',
      population_type: 'geography',
      policy_id: 2,
    });
    expect(mockCreateSimulation).toHaveBeenNthCalledWith(2, 'us', {
      population_id: 'congressional_district/CA-01',
      population_type: 'geography',
      policy_id: 77,
    });
  });

  test('given a run then its calculation starts at once, as the report page asks for it', async () => {
    mockFetchSocietyWide.mockResolvedValue({ status: 'computing', result: null });

    await runFlagshipReport({
      countryId: 'us',
      title: 'CTC expansion',
      sourceNote: '',
      provisions: [PROVISION],
      currentLawId: 2,
      year: 2027,
      region: 'state/de',
    });

    expect(mockFetchSocietyWide).toHaveBeenCalledWith('us', '77', '2', {
      region: 'state/de',
      time_period: '2027',
    });
  });

  test('given a nationwide run then the calculation asks for the country', async () => {
    mockFetchSocietyWide.mockRejectedValue(new Error('offline'));

    // A failed first request doesn't fail the run: the report page asks again.
    await expect(
      runFlagshipReport({
        countryId: 'us',
        title: 'CTC expansion',
        sourceNote: '',
        provisions: [PROVISION],
        currentLawId: 2,
        year: 2026,
      })
    ).resolves.toBe('55');
    expect(mockFetchSocietyWide).toHaveBeenCalledWith('us', '77', '2', {
      region: 'us',
      time_period: '2026',
    });
  });

  test('given a budget window with the run then it starts at once and the report knows it', async () => {
    mockFetchBudgetWindow.mockResolvedValue({ status: 'computing', result: null });

    await runFlagshipReport({
      countryId: 'us',
      title: 'CTC expansion',
      sourceNote: '',
      provisions: [PROVISION],
      currentLawId: 2,
      year: 2026,
      region: 'state/de',
      windowYears: 10,
    });

    // Submitted with the report, on its reform, baseline and population.
    expect(mockFetchBudgetWindow).toHaveBeenCalledWith('us', '77', '2', {
      region: 'state/de',
      startYear: 2026,
      windowSize: 10,
    });
    expect(readReportMeta('55')?.budgetWindow).toEqual({ startYear: 2026, windowSize: 10 });
  });

  test('given one year then no window starts', async () => {
    await runFlagshipReport({
      countryId: 'us',
      title: 'CTC expansion',
      sourceNote: '',
      provisions: [PROVISION],
      currentLawId: 2,
      windowYears: 1,
    });

    expect(mockFetchBudgetWindow).not.toHaveBeenCalled();
    expect(readReportMeta('55')?.budgetWindow).toBeUndefined();
  });

  test('given a run then provenance is stashed under the API report id', async () => {
    await runFlagshipReport({
      countryId: 'us',
      title: 'CTC expansion',
      sourceNote: 'Federal · Introduced',
      provisions: [PROVISION],
      currentLawId: 2,
    });

    const meta = readReportMeta('55');
    expect(meta?.title).toBe('CTC expansion');
    expect(meta?.sourceNote).toBe('Federal · Introduced');
    expect(meta?.provisions).toEqual([PROVISION]);
  });

  test('given no provisions then it refuses to run', async () => {
    await expect(
      runFlagshipReport({
        countryId: 'us',
        title: 'Empty',
        sourceNote: 'Draft',
        provisions: [],
        currentLawId: 2,
      })
    ).rejects.toThrow(/no provisions/);
    expect(mockCreatePolicy).not.toHaveBeenCalled();
  });

  test('given a signed-out run then only the v3 keys are written, never the legacy ones', async () => {
    // When
    await runFlagshipReport({
      countryId: 'us',
      title: 'CTC expansion',
      sourceNote: 'Federal · Introduced',
      provisions: [PROVISION],
      currentLawId: 2,
      reformId: 'rf-local1',
    });

    // Then
    const records = JSON.parse(localStorage.getItem('pe-flagship-reports') ?? '[]');
    expect(records).toEqual([
      expect.objectContaining({
        apiReportId: '55',
        title: 'CTC expansion',
        reformId: 'rf-local1',
      }),
    ]);
    expect(localStorage.getItem(REPORT_META_KEY)).not.toBeNull();
    for (const legacyKey of LEGACY_KEYS) {
      expect(localStorage.getItem(legacyKey)).toBeNull();
    }
  });

  test('given a signed-in run then exactly one account association is written', async () => {
    // Given
    const accountStore = {
      create: vi.fn().mockResolvedValue({ id: 'row-1' }),
    } as unknown as FlagshipReportStore;

    // When
    const reportId = await runFlagshipReport({
      countryId: 'us',
      title: 'CTC expansion',
      sourceNote: 'Federal · Introduced',
      provisions: [PROVISION],
      currentLawId: 2,
      reformId: REFORM_ROW_ID,
      year: 2027,
      accountReportStore: accountStore,
    });

    // Then
    expect(reportId).toBe('55');
    expect(mockCreateReport).toHaveBeenCalledWith('us', {
      simulation_1_id: 101,
      simulation_2_id: 102,
      year: '2027',
    });
    expect(accountStore.create).toHaveBeenCalledTimes(1);
    expect(accountStore.create).toHaveBeenCalledWith({
      countryId: 'us',
      apiReportId: '55',
      title: 'CTC expansion',
      sourceNote: 'Federal · Introduced',
      provisions: [PROVISION],
      year: '2027',
      reformId: REFORM_ROW_ID,
      budgetWindowYears: null,
    });
    expect(localStorage.getItem('pe-flagship-reports')).toBeNull();
    for (const legacyKey of LEGACY_KEYS) {
      expect(localStorage.getItem(legacyKey)).toBeNull();
    }
    expect(readReportMeta('55')?.title).toBe('CTC expansion');
  });

  test('given a run with a budget window then the account record keeps the window', async () => {
    // Given
    const accountStore = {
      create: vi.fn().mockResolvedValue({ id: 'row-1' }),
    } as unknown as FlagshipReportStore;

    // When
    await runFlagshipReport({
      countryId: 'us',
      title: 'CTC expansion',
      sourceNote: '',
      provisions: [PROVISION],
      currentLawId: 2,
      windowYears: 10,
      accountReportStore: accountStore,
    });

    // Then: a reload on any device reads it back from the record
    expect(accountStore.create).toHaveBeenCalledWith(
      expect.objectContaining({ budgetWindowYears: 10 })
    );
  });

  test('given a signed-in run then its provenance stays out of localStorage and goes on sign-out', async () => {
    // Given
    const accountStore = {
      create: vi.fn().mockResolvedValue({ id: 'row-1' }),
    } as unknown as FlagshipReportStore;

    // When
    await runFlagshipReport({
      countryId: 'us',
      title: 'CTC expansion',
      sourceNote: 'Federal · Introduced',
      provisions: [PROVISION],
      currentLawId: 2,
      accountReportStore: accountStore,
    });

    // Then: the next person on this browser cannot find it
    expect(localStorage.getItem(REPORT_META_KEY)).toBeNull();
    expect(readReportMeta('55')?.title).toBe('CTC expansion');
    forgetAccountReportMeta();
    expect(readReportMeta('55')).toBeNull();
  });

  test('given the account association fails then the signed-in run fails', async () => {
    // Given
    const accountStore = {
      create: vi.fn().mockRejectedValue(new Error('Saved work is temporarily unavailable.')),
    } as unknown as FlagshipReportStore;

    // When / Then
    await expect(
      runFlagshipReport({
        countryId: 'us',
        title: 'CTC expansion',
        sourceNote: '',
        provisions: [PROVISION],
        currentLawId: 2,
        accountReportStore: accountStore,
      })
    ).rejects.toThrow('Saved work is temporarily unavailable.');
  });
});

describe('reportMetaFromRecord', () => {
  const accountRecord: FlagshipReportRecord = {
    id: 'row-1',
    countryId: 'us',
    apiReportId: '55',
    title: 'CTC expansion',
    sourceNote: 'Hand-built draft',
    provisions: [PROVISION],
    createdAt: '2026-10-14T00:00:00Z',
    budgetWindowYears: 10,
  };

  test('given a record with a budget window then the window starts in the report year', () => {
    expect(reportMetaFromRecord(accountRecord, '2027')).toEqual({
      title: 'CTC expansion',
      sourceNote: 'Hand-built draft',
      provisions: [PROVISION],
      createdAt: '2026-10-14T00:00:00Z',
      budgetWindow: { startYear: 2027, windowSize: 10 },
    });
  });

  test('given no window, or no report year yet, then the details carry no window', () => {
    expect(
      reportMetaFromRecord({ ...accountRecord, budgetWindowYears: null }, '2027')
    ).not.toHaveProperty('budgetWindow');
    expect(reportMetaFromRecord(accountRecord, undefined)).not.toHaveProperty('budgetWindow');
  });

  test('given no record, or one without provisions, then there are no details', () => {
    expect(reportMetaFromRecord(null, '2027')).toBeNull();
    expect(reportMetaFromRecord({ ...accountRecord, provisions: [] }, '2027')).toBeNull();
  });
});

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
/** The account row a signed-in run writes; its ID is the report's link. */
const REPORT_ROW_ID = '44444444-4444-4444-8444-444444444444';

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
    // Account runs keep their details in memory for the page session.
    forgetAccountReportMeta();
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

  describe('given a saved reform to compare with', () => {
    const SAVED_BASELINE = {
      reformId: 'rf-plan-b',
      label: 'Plan B',
      parameters: [
        {
          name: 'gov.irs.credits.ctc.amount.base[0].amount',
          values: [{ startDate: '2026-01-01', endDate: '2100-12-31', value: 3000 }],
        },
      ],
    };

    /** Plan B's change, as its unlabelled baseline policy carries it. */
    const PLAN_B_DATA = {
      'gov.irs.credits.ctc.amount.base[0].amount': { '2026-01-01.2100-12-31': 3000 },
    };

    beforeEach(() => {
      // The reform and the baseline each become their own policy, told
      // apart by what they change: neither carries a name.
      mockCreatePolicy.mockImplementation(
        async (_country: string, payload: { data: Record<string, unknown> }) => ({
          result: {
            policy_id: JSON.stringify(payload.data) === JSON.stringify(PLAN_B_DATA) ? '88' : '77',
          },
        })
      );
      mockFetchSocietyWide.mockResolvedValue({ status: 'computing', result: null });
      mockFetchBudgetWindow.mockResolvedValue({ status: 'computing', result: null });
    });

    test('then its parameters become the baseline policy', async () => {
      await runFlagshipReport({
        countryId: 'us',
        title: 'CTC expansion',
        sourceNote: '',
        provisions: [PROVISION],
        currentLawId: 2,
        baseline: SAVED_BASELINE,
      });

      expect(mockCreatePolicy).toHaveBeenCalledWith('us', { data: PLAN_B_DATA });
      // Names live on the user's records, never on the base policies.
      for (const [, payload] of mockCreatePolicy.mock.calls) {
        expect(payload).not.toHaveProperty('label');
      }
    });

    test('then the baseline simulation, the calculation and the window all use it', async () => {
      await runFlagshipReport({
        countryId: 'us',
        title: 'CTC expansion',
        sourceNote: '',
        provisions: [PROVISION],
        currentLawId: 2,
        year: 2026,
        windowYears: 10,
        baseline: SAVED_BASELINE,
      });

      expect(mockCreateSimulation).toHaveBeenNthCalledWith(1, 'us', {
        population_id: 'us',
        population_type: 'geography',
        policy_id: 88,
      });
      expect(mockCreateSimulation).toHaveBeenNthCalledWith(2, 'us', {
        population_id: 'us',
        population_type: 'geography',
        policy_id: 77,
      });
      // The economy asks for the reform over the chosen baseline: /economy/77/over/88.
      expect(mockFetchSocietyWide).toHaveBeenCalledWith('us', '77', '88', {
        region: 'us',
        time_period: '2026',
      });
      expect(mockFetchBudgetWindow).toHaveBeenCalledWith('us', '77', '88', {
        region: 'us',
        startYear: 2026,
        windowSize: 10,
      });
    });

    test('then the account record links the compared reform, without its name', async () => {
      const accountStore = {
        create: vi.fn().mockResolvedValue({ id: 'row-1' }),
      } as unknown as FlagshipReportStore;

      await runFlagshipReport({
        countryId: 'us',
        title: 'CTC expansion',
        sourceNote: '',
        provisions: [PROVISION],
        currentLawId: 2,
        baseline: SAVED_BASELINE,
        accountReportStore: accountStore,
      });

      expect(accountStore.create).toHaveBeenCalledWith(
        expect.objectContaining({ baselineReformId: 'rf-plan-b' })
      );
      expect(JSON.stringify(vi.mocked(accountStore.create).mock.calls[0][0])).not.toContain(
        'Plan B'
      );
    });

    test('then the report meta records it by id and name', async () => {
      await runFlagshipReport({
        countryId: 'us',
        title: 'CTC expansion',
        sourceNote: '',
        provisions: [PROVISION],
        currentLawId: 2,
        baseline: SAVED_BASELINE,
      });

      expect(readReportMeta('55')?.baseline).toEqual({
        reformId: 'rf-plan-b',
        policyId: '88',
        label: 'Plan B',
      });
    });

    test('given its policy already then the run reuses it without making one', async () => {
      await runFlagshipReport({
        countryId: 'us',
        title: 'CTC expansion',
        sourceNote: '',
        provisions: [PROVISION],
        currentLawId: 2,
        baseline: { reformId: 'rf-plan-b', label: 'Plan B', policyId: 88 },
      });

      expect(mockCreatePolicy).toHaveBeenCalledTimes(1);
      expect(mockCreateSimulation).toHaveBeenNthCalledWith(
        1,
        'us',
        expect.objectContaining({ policy_id: 88 })
      );
      expect(readReportMeta('55')?.baseline).toEqual({
        reformId: 'rf-plan-b',
        policyId: '88',
        label: 'Plan B',
      });
    });
  });

  test('given no baseline then the report compares with current law and records none', async () => {
    await runFlagshipReport({
      countryId: 'us',
      title: 'CTC expansion',
      sourceNote: '',
      provisions: [PROVISION],
      currentLawId: 2,
    });

    expect(mockCreatePolicy).toHaveBeenCalledTimes(1);
    expect(mockCreateSimulation).toHaveBeenNthCalledWith(
      1,
      'us',
      expect.objectContaining({ policy_id: 2 })
    );
    expect(readReportMeta('55')).not.toHaveProperty('baseline');
  });

  test('given a baseline with nothing in it then the report compares with current law', async () => {
    await runFlagshipReport({
      countryId: 'us',
      title: 'CTC expansion',
      sourceNote: '',
      provisions: [PROVISION],
      currentLawId: 2,
      baseline: { reformId: 'rf-empty', label: 'Empty', parameters: [] },
    });

    expect(mockCreateSimulation).toHaveBeenNthCalledWith(
      1,
      'us',
      expect.objectContaining({ policy_id: 2 })
    );
    expect(readReportMeta('55')).not.toHaveProperty('baseline');
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
      create: vi.fn().mockResolvedValue({ id: REPORT_ROW_ID }),
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

    // Then: the account row's ID is the report's link, which anyone can open
    expect(reportId).toBe(REPORT_ROW_ID);
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
      baselineReformId: null,
    });
    expect(localStorage.getItem('pe-flagship-reports')).toBeNull();
    for (const legacyKey of LEGACY_KEYS) {
      expect(localStorage.getItem(legacyKey)).toBeNull();
    }
    expect(readReportMeta(REPORT_ROW_ID)?.title).toBe('CTC expansion');
  });

  test('given a run with a budget window then the account record keeps the window', async () => {
    // Given
    const accountStore = {
      create: vi.fn().mockResolvedValue({ id: REPORT_ROW_ID }),
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
      create: vi.fn().mockResolvedValue({ id: REPORT_ROW_ID }),
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
    expect(readReportMeta(REPORT_ROW_ID)?.title).toBe('CTC expansion');
    forgetAccountReportMeta();
    expect(readReportMeta(REPORT_ROW_ID)).toBeNull();
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

  test('given the compared reform, named by the caller, then the details carry it', () => {
    const baseline = { reformId: 'rf-plan-b', policyId: '88', label: 'Plan B' };

    expect(
      reportMetaFromRecord({ ...accountRecord, baselineReformId: 'rf-plan-b' }, '2027', baseline)
        ?.baseline
    ).toEqual(baseline);
    expect(reportMetaFromRecord(accountRecord, '2027')).not.toHaveProperty('baseline');
  });

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

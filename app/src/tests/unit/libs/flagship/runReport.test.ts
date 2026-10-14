import { beforeEach, describe, expect, test, vi } from 'vitest';
import { readReportMeta, runFlagshipReport } from '@/libs/flagship/runReport';

const mockCreatePolicy = vi.fn();
const mockCreateSimulation = vi.fn();
const mockCreateReportAndAssociate = vi.fn();
const mockFetchBudgetWindow = vi.fn();
const mockFetchSocietyWide = vi.fn();

vi.mock('@/api/policy', () => ({
  createPolicy: (...args: any[]) => mockCreatePolicy(...args),
}));
vi.mock('@/api/simulation', () => ({
  createSimulation: (...args: any[]) => mockCreateSimulation(...args),
}));
vi.mock('@/api/report', () => ({
  createReportAndAssociateWithUser: (...args: any[]) => mockCreateReportAndAssociate(...args),
}));
vi.mock('@/api/budgetWindow', () => ({
  fetchBudgetWindow: (...args: any[]) => mockFetchBudgetWindow(...args),
}));
vi.mock('@/api/societyWideCalculation', () => ({
  fetchSocietyWideCalculation: (...args: any[]) => mockFetchSocietyWide(...args),
}));

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
    mockCreateReportAndAssociate.mockResolvedValue({
      metadata: { baseReportId: '55', userReportId: 'sur-abc', countryId: 'us' },
    });
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
    expect(mockCreateReportAndAssociate).not.toHaveBeenCalled();
    resolveReform({ result: { simulation_id: '102' } });
    await Promise.resolve();
    expect(mockCreateReportAndAssociate).not.toHaveBeenCalled();
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
    expect(mockCreatePolicy).toHaveBeenCalledWith('us', {
      label: 'CTC expansion',
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
    expect(mockCreateReportAndAssociate).toHaveBeenCalledWith(
      expect.objectContaining({
        countryId: 'us',
        payload: { simulation_1_id: 101, simulation_2_id: 102, year: '2026' },
      })
    );
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

    beforeEach(() => {
      // The reform and the baseline each become their own policy.
      mockCreatePolicy.mockImplementation(
        async (_country: string, payload: { label?: string }) => ({
          result: { policy_id: payload.label === 'Plan B' ? '88' : '77' },
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

      expect(mockCreatePolicy).toHaveBeenCalledWith('us', {
        label: 'Plan B',
        data: {
          'gov.irs.credits.ctc.amount.base[0].amount': { '2026-01-01.2100-12-31': 3000 },
        },
      });
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
});

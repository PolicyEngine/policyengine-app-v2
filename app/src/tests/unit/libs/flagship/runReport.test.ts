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

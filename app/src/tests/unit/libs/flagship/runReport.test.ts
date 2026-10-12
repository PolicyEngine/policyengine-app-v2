import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { FlagshipReportStore } from '@/api/flagshipReportStore';
import { readReportMeta, runFlagshipReport } from '@/libs/flagship/runReport';

const mockCreatePolicy = vi.fn();
const mockCreateSimulation = vi.fn();
const mockCreateReportAndAssociate = vi.fn();
const mockCreateReport = vi.fn();

vi.mock('@/api/policy', () => ({
  createPolicy: (...args: any[]) => mockCreatePolicy(...args),
}));
vi.mock('@/api/simulation', () => ({
  createSimulation: (...args: any[]) => mockCreateSimulation(...args),
}));
vi.mock('@/api/report', () => ({
  createReportAndAssociateWithUser: (...args: any[]) => mockCreateReportAndAssociate(...args),
  createReport: (...args: any[]) => mockCreateReport(...args),
}));

const ACCOUNT_USER_ID = '7c1e5a8e-2b1f-4c55-9a3e-1f2d3c4b5a69';
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
    mockCreateReportAndAssociate.mockResolvedValue({
      metadata: { baseReportId: '55', userReportId: 'sur-abc', countryId: 'us' },
    });
    mockCreateReport.mockResolvedValue({ id: 56, country_id: 'us', year: '2026' });
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

  test('given a signed-out run then the local association and local record are written', async () => {
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
    expect(mockCreateReportAndAssociate).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'anonymous', label: 'CTC expansion' })
    );
    expect(mockCreateReport).not.toHaveBeenCalled();
    const records = JSON.parse(localStorage.getItem('pe-flagship-reports') ?? '[]');
    expect(records).toEqual([
      expect.objectContaining({
        userId: 'anonymous',
        apiReportId: '55',
        title: 'CTC expansion',
        reformId: 'rf-local1',
      }),
    ]);
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
      account: { reportStore: accountStore, userId: ACCOUNT_USER_ID },
    });

    // Then
    expect(reportId).toBe('56');
    expect(mockCreateReport).toHaveBeenCalledWith('us', {
      simulation_1_id: 101,
      simulation_2_id: 102,
      year: '2027',
    });
    expect(mockCreateReportAndAssociate).not.toHaveBeenCalled();
    expect(accountStore.create).toHaveBeenCalledTimes(1);
    expect(accountStore.create).toHaveBeenCalledWith({
      userId: ACCOUNT_USER_ID,
      countryId: 'us',
      apiReportId: '56',
      title: 'CTC expansion',
      sourceNote: 'Federal · Introduced',
      provisions: [PROVISION],
      year: '2027',
      reformId: REFORM_ROW_ID,
    });
    expect(localStorage.getItem('pe-flagship-reports')).toBeNull();
    expect(localStorage.getItem('user-report-associations')).toBeNull();
    expect(readReportMeta('56')?.title).toBe('CTC expansion');
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
        account: { reportStore: accountStore, userId: ACCOUNT_USER_ID },
      })
    ).rejects.toThrow('Saved work is temporarily unavailable.');
  });
});

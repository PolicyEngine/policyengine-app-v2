import { beforeEach, describe, expect, test, vi } from 'vitest';
import { readReportMeta, runFlagshipReport } from '@/libs/flagship/runReport';

const mockCreatePolicy = vi.fn();
const mockCreateSimulation = vi.fn();
const mockCreateReportAndAssociate = vi.fn();

vi.mock('@/api/policy', () => ({
  createPolicy: (...args: any[]) => mockCreatePolicy(...args),
}));
vi.mock('@/api/simulation', () => ({
  createSimulation: (...args: any[]) => mockCreateSimulation(...args),
}));
vi.mock('@/api/report', () => ({
  createReportAndAssociateWithUser: (...args: any[]) => mockCreateReportAndAssociate(...args),
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

  test('given provisions then policy, both simulations, and report are created in order', async () => {
    const userReportId = await runFlagshipReport({
      countryId: 'us',
      title: 'CTC expansion',
      sourceNote: 'Federal · Introduced',
      provisions: [PROVISION],
      currentLawId: 2,
    });

    expect(userReportId).toBe('sur-abc');
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

  test('given a run then provenance is stashed under the userReportId', async () => {
    await runFlagshipReport({
      countryId: 'us',
      title: 'CTC expansion',
      sourceNote: 'Federal · Introduced',
      provisions: [PROVISION],
      currentLawId: 2,
    });

    const meta = readReportMeta('sur-abc');
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

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

const CURRENT_LAW_METADATA = {
  [PROVISION.path]: {
    type: 'parameter' as const,
    parameter: PROVISION.path,
    label: 'Child tax credit amount',
    values: { '2020-01-01': 2000 },
  },
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
      currentLawMetadata: CURRENT_LAW_METADATA,
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
      currentLawMetadata: CURRENT_LAW_METADATA,
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
        currentLawMetadata: CURRENT_LAW_METADATA,
        currentLawId: 2,
      })
    ).rejects.toThrow(/no provisions/);
    expect(mockCreatePolicy).not.toHaveBeenCalled();
  });

  test('given every provision matches current law then it refuses to run before API requests', async () => {
    await expect(
      runFlagshipReport({
        countryId: 'us',
        title: 'No-op',
        sourceNote: 'Draft',
        provisions: [{ ...PROVISION, value: 2000 }],
        currentLawMetadata: CURRENT_LAW_METADATA,
        currentLawId: 2,
      })
    ).rejects.toThrow(/match current law/i);
    expect(mockCreatePolicy).not.toHaveBeenCalled();
  });

  test('given current law changes inside the proposed range then sends only the effective segment', async () => {
    await runFlagshipReport({
      countryId: 'us',
      title: 'Future difference',
      sourceNote: 'Draft',
      provisions: [{ ...PROVISION, value: 2000 }],
      currentLawMetadata: {
        [PROVISION.path]: {
          ...CURRENT_LAW_METADATA[PROVISION.path],
          values: { '2020-01-01': 2000, '2027-07-01': 3000 },
        },
      },
      currentLawId: 2,
    });

    expect(mockCreatePolicy).toHaveBeenCalledWith('us', {
      label: 'Future difference',
      data: {
        [PROVISION.path]: { '2027-07-01.2100-12-31': 2000 },
      },
    });
  });
});

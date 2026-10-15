import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { FlagshipReportRecord } from '@/api/flagshipReportStore';
import { rerunSettings } from '@/libs/flagship/reportRerun';
import { saveReportMeta } from '@/libs/flagship/runReport';

const fetchReportById = vi.fn();
const fetchSimulationById = vi.fn();
vi.mock('@/api/report', () => ({
  fetchReportById: (...args: unknown[]) => fetchReportById(...args),
}));
vi.mock('@/api/simulation', () => ({
  fetchSimulationById: (...args: unknown[]) => fetchSimulationById(...args),
}));

const REPORT: FlagshipReportRecord = {
  id: 'rec-1',
  countryId: 'us',
  apiReportId: '70',
  title: 'Bigger CTC',
  sourceNote: 'Hand-built',
  provisions: [],
  year: '2027',
  createdAt: '2026-10-14T00:00:00Z',
  reformId: 'rf-1',
};

describe('rerunSettings', () => {
  beforeEach(() => {
    localStorage.clear();
    fetchReportById.mockResolvedValue({ simulation_1_id: '9' });
  });

  test('given a state report with a window and a saved baseline then a re-run keeps all three', async () => {
    fetchSimulationById.mockResolvedValue({
      population_type: 'geography',
      population_id: 'state/md',
    });
    saveReportMeta('70', {
      title: 'Bigger CTC',
      sourceNote: 'Hand-built',
      provisions: [],
      createdAt: '2026-10-14T00:00:00Z',
      budgetWindow: { startYear: 2027, windowSize: 10 },
      baseline: { reformId: 'rf-plan-b', policyId: '88', label: 'Plan B' },
    });

    expect(await rerunSettings('us', REPORT)).toEqual({
      region: 'state/md',
      windowYears: 10,
      baseline: { reformId: 'rf-plan-b', label: 'Plan B', policyId: 88 },
    });
  });

  test('given a nationwide report with no stored details then it re-runs nationwide on current law', async () => {
    fetchSimulationById.mockResolvedValue({ population_type: 'geography', population_id: 'us' });

    expect(await rerunSettings('us', REPORT)).toEqual({
      region: undefined,
      windowYears: undefined,
      baseline: undefined,
    });
  });

  test('given the API cannot be read then it re-runs nationwide', async () => {
    fetchReportById.mockRejectedValue(new Error('down'));

    expect((await rerunSettings('us', REPORT)).region).toBeUndefined();
  });
});

import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { FlagshipReportRecord } from '@/api/flagshipReportStore';
import { rerunSettings } from '@/libs/flagship/reportRerun';
import { saveReportMeta } from '@/libs/flagship/runReport';
import type { Reform } from '@/types/ingredients/Reform';

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

/** A `/v2/user-reports` row's ID: an account report's link. */
const REPORT_ROW_ID = '44444444-4444-4444-8444-444444444444';

/**
 * An account report: the row keeps no year (its v1 report does), its
 * budget window, and the saved reform it was compared with.
 */
const ACCOUNT_REPORT: FlagshipReportRecord = {
  ...REPORT,
  id: REPORT_ROW_ID,
  year: undefined,
  budgetWindowYears: 10,
  baselineReformId: 'rf-plan-b',
};

/** The saved reform the account report was compared with. */
const PLAN_B: Reform = {
  id: 'rf-plan-b',
  countryId: 'us',
  label: 'Plan B',
  policyId: '87',
  parameters: [],
  baseline: 'current-law',
  provenance: { source: 'manual' },
};

const savedReform = (reformId: string) => (reformId === PLAN_B.id ? PLAN_B : undefined);

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
      year: 2027,
      region: 'state/md',
      windowYears: 10,
      baseline: { reformId: 'rf-plan-b', label: 'Plan B', policyId: 88 },
    });
  });

  test('given a nationwide report with no stored details then it re-runs nationwide on current law', async () => {
    fetchSimulationById.mockResolvedValue({ population_type: 'geography', population_id: 'us' });

    expect(await rerunSettings('us', REPORT)).toEqual({
      year: 2027,
      region: undefined,
      windowYears: undefined,
      baseline: undefined,
    });
  });

  test('given the API cannot be read then it re-runs nationwide', async () => {
    fetchReportById.mockRejectedValue(new Error('down'));

    expect((await rerunSettings('us', REPORT)).region).toBeUndefined();
  });

  describe('given an account report', () => {
    beforeEach(() => {
      fetchReportById.mockResolvedValue({ simulation_1_id: '9', year: '2028' });
      fetchSimulationById.mockResolvedValue({
        population_type: 'geography',
        population_id: 'state/md',
        policy_id: '88',
      });
    });

    test('then its year, window and comparison come from its record and the API', async () => {
      // Given: no run details in this page session (another device, or a reload)

      // When
      const settings = await rerunSettings('us', ACCOUNT_REPORT, { savedReform });

      // Then: the baseline is the policy the report ran, named from the saved reform
      expect(settings).toEqual({
        year: 2028,
        region: 'state/md',
        windowYears: 10,
        baseline: { reformId: 'rf-plan-b', label: 'Plan B', policyId: 88 },
      });
    });

    test('then the run details this session kept under its link come first', async () => {
      // Given
      saveReportMeta(REPORT_ROW_ID, {
        title: 'Bigger CTC',
        sourceNote: 'Hand-built',
        provisions: [],
        createdAt: '2026-10-14T00:00:00Z',
        budgetWindow: { startYear: 2028, windowSize: 3 },
        baseline: { reformId: 'rf-plan-c', policyId: '90', label: 'Plan C' },
      });

      // When
      const settings = await rerunSettings('us', ACCOUNT_REPORT, { savedReform });

      // Then
      expect(settings).toMatchObject({
        windowYears: 3,
        baseline: { reformId: 'rf-plan-c', label: 'Plan C', policyId: 90 },
      });
    });

    test('then a compared reform that is no longer saved keeps its comparison, untitled', async () => {
      // When
      const settings = await rerunSettings('us', ACCOUNT_REPORT);

      // Then
      expect(settings.baseline).toEqual({
        reformId: 'rf-plan-b',
        label: 'Untitled reform',
        policyId: 88,
      });
    });

    test('then a report against current law runs against current law', async () => {
      // When
      const settings = await rerunSettings(
        'us',
        { ...ACCOUNT_REPORT, baselineReformId: null },
        { savedReform }
      );

      // Then
      expect(settings.baseline).toBeUndefined();
    });

    test("given the API cannot be read then the comparison is the saved reform's own policy", async () => {
      // Given
      fetchReportById.mockRejectedValue(new Error('down'));

      // When
      const settings = await rerunSettings('us', ACCOUNT_REPORT, { savedReform });

      // Then
      expect(settings.baseline).toEqual({ reformId: 'rf-plan-b', label: 'Plan B', policyId: 87 });
    });

    test('given neither the API nor the saved reform names the comparison then it does not run', async () => {
      // Given
      fetchReportById.mockRejectedValue(new Error('down'));

      // When / Then: rather than run against current law
      await expect(rerunSettings('us', ACCOUNT_REPORT)).rejects.toThrow();
    });
  });
});

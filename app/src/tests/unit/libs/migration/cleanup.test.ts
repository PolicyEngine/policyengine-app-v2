import { beforeEach, describe, expect, test } from 'vitest';
import { cleanupMigratedRecords } from '@/libs/migration/cleanup';
import type { OrchestratorResult } from '@/libs/migration/types';

const LS_KEYS = {
  reports: 'user-report-associations',
  simulations: 'user-simulation-associations',
  policies: 'user-policy-associations',
  households: 'user-population-households',
};

function makeSucceededResult(
  v1Id: string,
  deps?: Record<string, string | null>
): OrchestratorResult {
  return {
    success: true,
    v1UserAssociationId: v1Id,
    v1ReportId: '42',
    label: 'Test report',
    v2Ids: {
      baseEntityId: 'v2-report-uuid',
      dependencyIds: deps,
    },
    errors: [],
    warnings: [],
  };
}

function makeFailedResult(v1Id: string): OrchestratorResult {
  return {
    success: false,
    v1UserAssociationId: v1Id,
    v1ReportId: '99',
    label: 'Failed report',
    v2Ids: {},
    errors: [{ stage: 'policy', v1Id, message: 'Failed' }],
    warnings: [],
  };
}

describe('cleanup (dry run)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('given empty succeeded list then counts zero removals', () => {
    localStorage.setItem(LS_KEYS.reports, JSON.stringify([{ id: 'keep-me' }]));

    const result = cleanupMigratedRecords({
      total: 0,
      succeeded: [],
      failed: [],
    });

    expect(result.removedReports).toBe(0);
    // Dry run: localStorage is NOT modified
    const remaining = JSON.parse(localStorage.getItem(LS_KEYS.reports)!);
    expect(remaining).toHaveLength(1);
  });

  test('given succeeded results then counts matching reports for removal', () => {
    localStorage.setItem(
      LS_KEYS.reports,
      JSON.stringify([
        { id: 'ur-v1-001', reportId: '42' },
        { id: 'ur-v1-002', reportId: '99' },
        { id: 'ur-keep', reportId: '55' },
      ])
    );

    const result = cleanupMigratedRecords({
      total: 2,
      succeeded: [makeSucceededResult('ur-v1-001'), makeSucceededResult('ur-v1-002')],
      failed: [],
    });

    expect(result.removedReports).toBe(2);
    // Dry run: localStorage is NOT modified — all 3 records remain
    const remaining = JSON.parse(localStorage.getItem(LS_KEYS.reports)!);
    expect(remaining).toHaveLength(3);
  });

  test('given failed results then only counts succeeded for removal', () => {
    localStorage.setItem(
      LS_KEYS.reports,
      JSON.stringify([
        { id: 'ur-v1-001', reportId: '42' },
        { id: 'ur-v1-002', reportId: '99' },
      ])
    );

    const result = cleanupMigratedRecords({
      total: 2,
      succeeded: [makeSucceededResult('ur-v1-001')],
      failed: [makeFailedResult('ur-v1-002')],
    });

    expect(result.removedReports).toBe(1);
    // Dry run: localStorage is NOT modified — both records remain
    const remaining = JSON.parse(localStorage.getItem(LS_KEYS.reports)!);
    expect(remaining).toHaveLength(2);
  });

  test('given empty localStorage then returns zero counts', () => {
    const result = cleanupMigratedRecords({
      total: 1,
      succeeded: [makeSucceededResult('ur-v1-001')],
      failed: [],
    });

    expect(result.removedReports).toBe(0);
    expect(result.removedSimulations).toBe(0);
    expect(result.removedPolicies).toBe(0);
    expect(result.removedHouseholds).toBe(0);
  });

  test('given corrupt localStorage then handles gracefully', () => {
    localStorage.setItem(LS_KEYS.reports, 'not-valid-json');

    const result = cleanupMigratedRecords({
      total: 1,
      succeeded: [makeSucceededResult('ur-v1-001')],
      failed: [],
    });

    expect(result.removedReports).toBe(0);
  });

  test('given dependency IDs in succeeded results then counts removals from all stores', () => {
    localStorage.setItem(LS_KEYS.reports, JSON.stringify([{ id: 'ur-v1-001' }]));
    localStorage.setItem(
      LS_KEYS.simulations,
      JSON.stringify([{ id: 'sim-base-uuid' }, { id: 'sim-reform-uuid' }, { id: 'sim-keep' }])
    );
    localStorage.setItem(
      LS_KEYS.policies,
      JSON.stringify([{ id: 'v2-policy-uuid' }, { id: 'policy-keep' }])
    );
    localStorage.setItem(LS_KEYS.households, JSON.stringify([{ id: 'v2-hh-uuid' }]));

    const result = cleanupMigratedRecords({
      total: 1,
      succeeded: [
        makeSucceededResult('ur-v1-001', {
          baselinePolicyId: 'v2-policy-uuid',
          reformPolicyId: null,
          populationId: 'v2-hh-uuid',
          outputType: 'household',
          simulationId_0: 'sim-base-uuid',
          simulationId_1: 'sim-reform-uuid',
        }),
      ],
      failed: [],
    });

    expect(result.removedReports).toBe(1);
    expect(result.removedSimulations).toBe(2);
    expect(result.removedPolicies).toBe(1);
    expect(result.removedHouseholds).toBe(1);

    // Dry run: localStorage is NOT modified — all records remain
    expect(JSON.parse(localStorage.getItem(LS_KEYS.simulations)!)).toHaveLength(3);
    expect(JSON.parse(localStorage.getItem(LS_KEYS.policies)!)).toHaveLength(2);
    expect(JSON.parse(localStorage.getItem(LS_KEYS.households)!)).toHaveLength(1);
  });
});

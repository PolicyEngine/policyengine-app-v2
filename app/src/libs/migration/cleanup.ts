/**
 * localStorage Cleanup
 *
 * Removes successfully-migrated v1 records from localStorage.
 * Only removes records that were part of a successful migration run.
 *
 * NOT integrated into the migration pipeline — called separately
 * after testing confirms migration works.
 */

import type { MigrationRunResult, CleanupSummary } from './types';

const LS_KEYS = {
  reports: 'user-report-associations',
  simulations: 'user-simulation-associations',
  policies: 'user-policy-associations',
  households: 'user-population-households',
} as const;

/**
 * Remove successfully-migrated records from localStorage.
 *
 * Takes the results from migrateAllV1Reports() and removes ONLY
 * records whose v1 user-association ID appears in the succeeded list.
 */
export function cleanupMigratedRecords(results: MigrationRunResult): CleanupSummary {
  const succeededIds = new Set(
    results.succeeded.map((r) => r.v1UserAssociationId)
  );

  const summary: CleanupSummary = {
    removedReports: 0,
    removedSimulations: 0,
    removedPolicies: 0,
    removedHouseholds: 0,
  };

  summary.removedReports = removeFromLocalStorage(LS_KEYS.reports, succeededIds);

  // For simulations/policies/households, we also check dependency IDs
  const dependencyIds = new Set<string>();
  for (const result of results.succeeded) {
    if (result.v2Ids.dependencyIds) {
      for (const [key, value] of Object.entries(result.v2Ids.dependencyIds)) {
        // Dependency IDs are the v1 IDs that were migrated
        if (value && key !== 'outputType') {
          dependencyIds.add(value);
        }
      }
    }
  }

  const allIdsToRemove = new Set([...succeededIds, ...dependencyIds]);

  summary.removedSimulations = removeFromLocalStorage(LS_KEYS.simulations, allIdsToRemove);
  summary.removedPolicies = removeFromLocalStorage(LS_KEYS.policies, allIdsToRemove);
  summary.removedHouseholds = removeFromLocalStorage(LS_KEYS.households, allIdsToRemove);

  return summary;
}

/**
 * Remove records from a localStorage array by ID.
 * Returns the count of removed records.
 */
function removeFromLocalStorage(key: string, idsToRemove: Set<string>): number {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) {
      return 0;
    }

    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      return 0;
    }

    const before = parsed.length;
    const filtered = parsed.filter(
      (record: { id?: string }) => !record.id || !idsToRemove.has(record.id)
    );

    localStorage.setItem(key, JSON.stringify(filtered));
    return before - filtered.length;
  } catch {
    return 0;
  }
}

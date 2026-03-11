/**
 * localStorage Cleanup
 *
 * Removes successfully-migrated v1 records from localStorage.
 * Only removes records that were part of a successful migration run.
 */

import type { CleanupSummary, MigrationRunResult } from './types';

const LOG = '[migration:cleanup]';

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
  const succeededIds = new Set(results.succeeded.map((r) => r.v1UserAssociationId));

  const summary: CleanupSummary = {
    removedReports: 0,
    removedSimulations: 0,
    removedPolicies: 0,
    removedHouseholds: 0,
  };

  summary.removedReports = removeMatchingRecords(LS_KEYS.reports, succeededIds);

  // For simulations/policies/households, we also check dependency IDs
  const dependencyIds = new Set<string>();
  for (const result of results.succeeded) {
    if (result.v2Ids.dependencyIds) {
      for (const [key, value] of Object.entries(result.v2Ids.dependencyIds)) {
        if (value && key !== 'outputType') {
          dependencyIds.add(value);
        }
      }
    }
  }

  const allIdsToRemove = new Set([...succeededIds, ...dependencyIds]);

  summary.removedSimulations = removeMatchingRecords(LS_KEYS.simulations, allIdsToRemove);
  summary.removedPolicies = removeMatchingRecords(LS_KEYS.policies, allIdsToRemove);
  summary.removedHouseholds = removeMatchingRecords(LS_KEYS.households, allIdsToRemove);

  console.info(`${LOG} Cleanup summary:`, summary);
  return summary;
}

/**
 * Remove records matching the given IDs from a localStorage array.
 * Returns the number of records removed.
 */
function removeMatchingRecords(key: string, idsToRemove: Set<string>): number {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) {
      return 0;
    }

    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      return 0;
    }

    const kept = parsed.filter(
      (record: { id?: string }) => !record.id || !idsToRemove.has(record.id)
    );
    const removedCount = parsed.length - kept.length;

    if (removedCount > 0) {
      localStorage.setItem(key, JSON.stringify(kept));
      console.info(`${LOG}   "${key}": removed ${removedCount}/${parsed.length} record(s)`);
    }

    return removedCount;
  } catch (err) {
    console.error(`${LOG} Error processing localStorage key "${key}":`, err);
    return 0;
  }
}

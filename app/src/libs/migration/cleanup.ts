/**
 * localStorage Cleanup
 *
 * Removes successfully-migrated v1 records from localStorage.
 * Only removes records that were part of a successful migration run.
 *
 * NOT integrated into the migration pipeline — called separately
 * after testing confirms migration works.
 *
 * CURRENTLY DISABLED: All write operations are no-ops.
 * This allows repeated manual testing without losing v1 data.
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
 *
 * CURRENTLY: DRY RUN ONLY — logs what would be removed but does not touch localStorage.
 */
export function cleanupMigratedRecords(results: MigrationRunResult): CleanupSummary {
  console.warn(`${LOG} CLEANUP IS DISABLED — dry run only, localStorage will NOT be modified`);

  const succeededIds = new Set(results.succeeded.map((r) => r.v1UserAssociationId));

  const summary: CleanupSummary = {
    removedReports: 0,
    removedSimulations: 0,
    removedPolicies: 0,
    removedHouseholds: 0,
  };

  summary.removedReports = countWouldRemove(LS_KEYS.reports, succeededIds);

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

  summary.removedSimulations = countWouldRemove(LS_KEYS.simulations, allIdsToRemove);
  summary.removedPolicies = countWouldRemove(LS_KEYS.policies, allIdsToRemove);
  summary.removedHouseholds = countWouldRemove(LS_KEYS.households, allIdsToRemove);

  console.info(`${LOG} Dry run summary (would remove):`, summary);
  return summary;
}

/**
 * Count how many records WOULD be removed from a localStorage array.
 * Does NOT actually modify localStorage.
 */
function countWouldRemove(key: string, idsToRemove: Set<string>): number {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) {
      return 0;
    }

    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      return 0;
    }

    const wouldRemove = parsed.filter(
      (record: { id?: string }) => record.id && idsToRemove.has(record.id)
    );

    if (wouldRemove.length > 0) {
      console.info(
        `${LOG}   "${key}": would remove ${wouldRemove.length}/${parsed.length} record(s)`
      );
    }

    return wouldRemove.length;
  } catch {
    return 0;
  }
}

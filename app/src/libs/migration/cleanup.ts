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
    errors: [],
  };

  const reportsResult = removeMatchingRecords(LS_KEYS.reports, succeededIds);
  summary.removedReports = reportsResult.removed;
  if (reportsResult.error) {
    summary.errors.push(reportsResult.error);
  }

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

  const simsResult = removeMatchingRecords(LS_KEYS.simulations, allIdsToRemove);
  summary.removedSimulations = simsResult.removed;
  if (simsResult.error) {
    summary.errors.push(simsResult.error);
  }

  const policiesResult = removeMatchingRecords(LS_KEYS.policies, allIdsToRemove);
  summary.removedPolicies = policiesResult.removed;
  if (policiesResult.error) {
    summary.errors.push(policiesResult.error);
  }

  const householdsResult = removeMatchingRecords(LS_KEYS.households, allIdsToRemove);
  summary.removedHouseholds = householdsResult.removed;
  if (householdsResult.error) {
    summary.errors.push(householdsResult.error);
  }

  console.info(`${LOG} Cleanup summary:`, summary);
  return summary;
}

/**
 * Remove records matching the given IDs from a localStorage array.
 * Returns the number of records removed.
 */
function removeMatchingRecords(
  key: string,
  idsToRemove: Set<string>,
): { removed: number; error?: string } {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) {
      return { removed: 0 };
    }

    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      return { removed: 0 };
    }

    const kept = parsed.filter(
      (record: { id?: string }) => !record.id || !idsToRemove.has(record.id),
    );
    const removedCount = parsed.length - kept.length;

    if (removedCount > 0) {
      localStorage.setItem(key, JSON.stringify(kept));
      console.info(`${LOG}   "${key}": removed ${removedCount}/${parsed.length} record(s)`);
    }

    return { removed: removedCount };
  } catch (err) {
    const message = `Error processing localStorage key "${key}": ${err instanceof Error ? err.message : String(err)}`;
    console.error(`${LOG} ${message}`);
    return { removed: 0, error: message };
  }
}

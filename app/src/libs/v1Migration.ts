/**
 * V1-to-V2 Association Migration
 *
 * Migrates user association records from localStorage to the v2 API.
 * This runs automatically on app startup (via useV1Migration hook) and is
 * idempotent — it checks for existing v2 data before creating duplicates.
 *
 * Only the association records (links between user and entity) are migrated.
 * The underlying v1 entities (households, policies, simulations, reports)
 * remain in the v1 API and are accessed via the existing v1 read paths.
 */

import {
  createUserHouseholdAssociationV2,
  fetchUserHouseholdAssociationsV2,
} from '@/api/v2/userHouseholdAssociations';
import {
  createUserPolicyAssociationV2,
  fetchUserPolicyAssociationsV2,
} from '@/api/v2/userPolicyAssociations';
import {
  createUserReportAssociationV2,
  fetchUserReportAssociationsV2,
} from '@/api/v2/userReportAssociations';
import {
  createUserSimulationAssociationV2,
  fetchUserSimulationAssociationsV2,
} from '@/api/v2/userSimulationAssociations';
import type { UserPolicy } from '@/types/ingredients/UserPolicy';
import type { UserHouseholdPopulation } from '@/types/ingredients/UserPopulation';
import type { UserReport } from '@/types/ingredients/UserReport';
import type { UserSimulation } from '@/types/ingredients/UserSimulation';

const LOG_PREFIX = '[v1Migration]';

export const MIGRATION_FLAG_KEY = 'policyengine_v1_migrated';

export const LS_KEYS = {
  reports: 'user-report-associations',
  simulations: 'user-simulation-associations',
  policies: 'user-policy-associations',
  households: 'user-population-households',
} as const;

export function isMigrationComplete(): boolean {
  return localStorage.getItem(MIGRATION_FLAG_KEY) === 'true';
}

export function hasLocalStorageData(): boolean {
  return Object.values(LS_KEYS).some((key) => {
    const stored = localStorage.getItem(key);
    if (!stored) {
      return false;
    }
    try {
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) && parsed.length > 0;
    } catch {
      return false;
    }
  });
}

function setMigrationComplete(): void {
  localStorage.setItem(MIGRATION_FLAG_KEY, 'true');
}

function parseLocalStorage<T>(key: string): T[] {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) {
      return [];
    }
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    console.warn(`${LOG_PREFIX} Failed to parse localStorage key "${key}"`);
    return [];
  }
}

async function migrateReports(userId: string): Promise<boolean> {
  const local = parseLocalStorage<UserReport>(LS_KEYS.reports).filter((r) => r.userId === userId);
  if (local.length === 0) {
    return true;
  }

  try {
    const existing = await fetchUserReportAssociationsV2(userId);
    const existingReportIds = new Set(existing.map((r) => r.reportId));

    let allSucceeded = true;
    for (const report of local) {
      if (existingReportIds.has(report.reportId)) {
        console.info(`${LOG_PREFIX} Report ${report.reportId} already exists in v2, skipping`);
        continue;
      }
      try {
        await createUserReportAssociationV2({
          userId: report.userId,
          reportId: report.reportId,
          countryId: report.countryId,
          label: report.label,
        });

        console.info(`${LOG_PREFIX} Migrated report ${report.reportId}`);
      } catch (err) {
        console.error(`${LOG_PREFIX} Failed to migrate report ${report.reportId}:`, err);
        allSucceeded = false;
      }
    }
    return allSucceeded;
  } catch (err) {
    console.error(`${LOG_PREFIX} Failed to fetch existing reports:`, err);
    return false;
  }
}

async function migrateSimulations(userId: string): Promise<boolean> {
  const local = parseLocalStorage<UserSimulation>(LS_KEYS.simulations).filter(
    (s) => s.userId === userId
  );
  if (local.length === 0) {
    return true;
  }

  try {
    const existing = await fetchUserSimulationAssociationsV2(userId);
    const existingSimIds = new Set(existing.map((s) => s.simulationId));

    let allSucceeded = true;
    for (const sim of local) {
      if (existingSimIds.has(sim.simulationId)) {
        console.info(`${LOG_PREFIX} Simulation ${sim.simulationId} already exists in v2, skipping`);
        continue;
      }
      try {
        await createUserSimulationAssociationV2({
          userId: sim.userId,
          simulationId: sim.simulationId,
          countryId: sim.countryId,
          label: sim.label,
        });

        console.info(`${LOG_PREFIX} Migrated simulation ${sim.simulationId}`);
      } catch (err) {
        console.error(`${LOG_PREFIX} Failed to migrate simulation ${sim.simulationId}:`, err);
        allSucceeded = false;
      }
    }
    return allSucceeded;
  } catch (err) {
    console.error(`${LOG_PREFIX} Failed to fetch existing simulations:`, err);
    return false;
  }
}

async function migratePolicies(userId: string): Promise<boolean> {
  const local = parseLocalStorage<UserPolicy>(LS_KEYS.policies).filter((p) => p.userId === userId);
  if (local.length === 0) {
    return true;
  }

  try {
    const existing = await fetchUserPolicyAssociationsV2(userId);
    const existingPolicyIds = new Set(existing.map((p) => p.policyId));

    let allSucceeded = true;
    for (const policy of local) {
      if (existingPolicyIds.has(policy.policyId)) {
        console.info(`${LOG_PREFIX} Policy ${policy.policyId} already exists in v2, skipping`);
        continue;
      }
      try {
        await createUserPolicyAssociationV2({
          userId: policy.userId,
          policyId: policy.policyId,
          countryId: policy.countryId,
          label: policy.label,
        });

        console.info(`${LOG_PREFIX} Migrated policy ${policy.policyId}`);
      } catch (err) {
        console.error(`${LOG_PREFIX} Failed to migrate policy ${policy.policyId}:`, err);
        allSucceeded = false;
      }
    }
    return allSucceeded;
  } catch (err) {
    console.error(`${LOG_PREFIX} Failed to fetch existing policies:`, err);
    return false;
  }
}

async function migrateHouseholds(userId: string): Promise<boolean> {
  const local = parseLocalStorage<UserHouseholdPopulation>(LS_KEYS.households).filter(
    (h) => h.userId === userId
  );
  if (local.length === 0) {
    return true;
  }

  try {
    const existing = await fetchUserHouseholdAssociationsV2(userId);
    const existingHouseholdIds = new Set(existing.map((h) => h.householdId));

    let allSucceeded = true;
    for (const household of local) {
      if (existingHouseholdIds.has(household.householdId)) {
        console.info(
          `${LOG_PREFIX} Household ${household.householdId} already exists in v2, skipping`
        );
        continue;
      }
      try {
        await createUserHouseholdAssociationV2({
          userId: household.userId,
          householdId: household.householdId,
          countryId: household.countryId,
          label: household.label,
        });

        console.info(`${LOG_PREFIX} Migrated household ${household.householdId}`);
      } catch (err) {
        console.error(`${LOG_PREFIX} Failed to migrate household ${household.householdId}:`, err);
        allSucceeded = false;
      }
    }
    return allSucceeded;
  } catch (err) {
    console.error(`${LOG_PREFIX} Failed to fetch existing households:`, err);
    return false;
  }
}

/**
 * Run the full v1→v2 migration for all 4 association types.
 *
 * Idempotent: fetches existing v2 data before creating, skips duplicates.
 * Sets the migration-complete flag only if all types migrate successfully.
 *
 * @returns true if migration completed successfully
 */
export async function migrateV1AssociationsToV2(userId: string): Promise<boolean> {
  console.info(`${LOG_PREFIX} Starting migration for user ${userId}`);

  const [reportsOk, simulationsOk, policiesOk, householdsOk] = await Promise.all([
    migrateReports(userId),
    migrateSimulations(userId),
    migratePolicies(userId),
    migrateHouseholds(userId),
  ]);

  const allOk = reportsOk && simulationsOk && policiesOk && householdsOk;

  if (allOk) {
    setMigrationComplete();

    console.info(`${LOG_PREFIX} All associations migrated successfully`);
  } else {
    console.warn(`${LOG_PREFIX} Some associations failed to migrate, will retry on next load`);
  }

  return allOk;
}

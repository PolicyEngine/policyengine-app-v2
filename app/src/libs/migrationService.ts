/**
 * Migration Service
 *
 * Handles one-time migration of user associations from localStorage to API v2.
 * This service reads all existing localStorage data, updates records with the
 * new persistent user ID, and saves them to the database via API.
 */

import { UserGeographyPopulation, UserHouseholdPopulation } from '@/types/ingredients/UserPopulation';
import { UserPolicy } from '@/types/ingredients/UserPolicy';
import { UserReport } from '@/types/ingredients/UserReport';
import { UserSimulation } from '@/types/ingredients/UserSimulation';

import { isMigrationComplete, markMigrationComplete, getUserId } from './userIdentity';

// localStorage keys used by the old stores
const STORAGE_KEYS = {
  HOUSEHOLDS: 'user-population-households',
  POLICIES: 'user-policy-associations',
  SIMULATIONS: 'user-simulation-associations',
  REPORTS: 'user-report-associations',
  GEOGRAPHIES: 'user-geographic-associations',
} as const;

// Old mock user ID that was used before migration
const OLD_MOCK_USER_ID = 'anonymous';

/**
 * Result of a migration attempt for a single association type
 */
export interface MigrationResult {
  type: string;
  totalRecords: number;
  migratedCount: number;
  skippedCount: number;
  errorCount: number;
  errors: string[];
}

/**
 * Complete migration report
 */
export interface MigrationReport {
  success: boolean;
  newUserId: string;
  startTime: string;
  endTime: string;
  results: MigrationResult[];
}

/**
 * Checks if migration is needed.
 *
 * Migration is needed if:
 * 1. Migration hasn't been completed yet
 * 2. There's existing data in localStorage
 *
 * @returns true if migration should run
 */
export function needsMigration(): boolean {
  if (isMigrationComplete()) {
    return false;
  }

  // Check if any localStorage data exists
  return Object.values(STORAGE_KEYS).some((key) => {
    const data = localStorage.getItem(key);
    if (!data) return false;
    try {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) && parsed.length > 0;
    } catch {
      return false;
    }
  });
}

/**
 * Reads and parses data from a localStorage key.
 *
 * @param key - The localStorage key to read
 * @returns Parsed array of records, or empty array if none/invalid
 */
function readLocalStorage<T>(key: string): T[] {
  try {
    const data = localStorage.getItem(key);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    console.warn(`[MigrationService] Failed to parse localStorage key: ${key}`);
    return [];
  }
}

/**
 * Updates a record's userId to the new persistent user ID if needed.
 *
 * @param record - The record to update
 * @param newUserId - The new persistent user ID
 * @returns Updated record (or original if no change needed)
 */
function updateUserId<T extends { userId: string }>(record: T, newUserId: string): T {
  // Only update if using the old mock user ID
  if (record.userId === OLD_MOCK_USER_ID) {
    return { ...record, userId: newUserId };
  }
  return record;
}

/**
 * Reads all household associations from localStorage.
 *
 * @param newUserId - The new persistent user ID to assign
 * @returns Array of household associations with updated user IDs
 */
export function getHouseholdsForMigration(newUserId: string): UserHouseholdPopulation[] {
  const records = readLocalStorage<UserHouseholdPopulation>(STORAGE_KEYS.HOUSEHOLDS);
  return records.map((record) => updateUserId(record, newUserId));
}

/**
 * Reads all policy associations from localStorage.
 *
 * @param newUserId - The new persistent user ID to assign
 * @returns Array of policy associations with updated user IDs
 */
export function getPoliciesForMigration(newUserId: string): UserPolicy[] {
  const records = readLocalStorage<UserPolicy>(STORAGE_KEYS.POLICIES);
  return records.map((record) => updateUserId(record, newUserId));
}

/**
 * Reads all simulation associations from localStorage.
 *
 * @param newUserId - The new persistent user ID to assign
 * @returns Array of simulation associations with updated user IDs
 */
export function getSimulationsForMigration(newUserId: string): UserSimulation[] {
  const records = readLocalStorage<UserSimulation>(STORAGE_KEYS.SIMULATIONS);
  return records.map((record) => updateUserId(record, newUserId));
}

/**
 * Reads all report associations from localStorage.
 *
 * @param newUserId - The new persistent user ID to assign
 * @returns Array of report associations with updated user IDs
 */
export function getReportsForMigration(newUserId: string): UserReport[] {
  const records = readLocalStorage<UserReport>(STORAGE_KEYS.REPORTS);
  return records.map((record) => updateUserId(record, newUserId));
}

/**
 * Reads all geographic associations from localStorage.
 *
 * @param newUserId - The new persistent user ID to assign
 * @returns Array of geographic associations with updated user IDs
 */
export function getGeographiesForMigration(newUserId: string): UserGeographyPopulation[] {
  const records = readLocalStorage<UserGeographyPopulation>(STORAGE_KEYS.GEOGRAPHIES);
  return records.map((record) => updateUserId(record, newUserId));
}

/**
 * Clears all association data from localStorage.
 * Called after successful migration to API.
 */
export function clearLocalStorageData(): void {
  Object.values(STORAGE_KEYS).forEach((key) => {
    localStorage.removeItem(key);
  });
}

/**
 * API migration interface - to be implemented when v2 endpoints are ready.
 *
 * This will be called by the migration function to save records to the API.
 */
export interface MigrationAPI {
  createHousehold: (household: UserHouseholdPopulation) => Promise<void>;
  createPolicy: (policy: UserPolicy) => Promise<void>;
  createSimulation: (simulation: UserSimulation) => Promise<void>;
  createReport: (report: UserReport) => Promise<void>;
  createGeography: (geography: UserGeographyPopulation) => Promise<void>;
}

/**
 * Migrates a single association type to the API.
 *
 * @param type - The type of association being migrated
 * @param records - The records to migrate
 * @param createFn - The API function to create each record
 * @returns Migration result for this type
 */
async function migrateAssociationType<T>(
  type: string,
  records: T[],
  createFn: (record: T) => Promise<void>
): Promise<MigrationResult> {
  const result: MigrationResult = {
    type,
    totalRecords: records.length,
    migratedCount: 0,
    skippedCount: 0,
    errorCount: 0,
    errors: [],
  };

  for (const record of records) {
    try {
      await createFn(record);
      result.migratedCount++;
    } catch (error) {
      // Handle duplicate/conflict errors gracefully (idempotent)
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('duplicate') || errorMessage.includes('already exists')) {
        result.skippedCount++;
      } else {
        result.errorCount++;
        result.errors.push(errorMessage);
      }
    }
  }

  return result;
}

/**
 * Runs the full migration from localStorage to API.
 *
 * This function:
 * 1. Gets the persistent user ID
 * 2. Reads all localStorage data
 * 3. Saves each record to the API with the new user ID
 * 4. Clears localStorage data after successful migration
 * 5. Marks migration as complete
 *
 * @param api - The migration API implementation
 * @returns Migration report with results for each association type
 */
export async function migrateAllAssociations(api: MigrationAPI): Promise<MigrationReport> {
  const startTime = new Date().toISOString();
  const newUserId = getUserId();
  const results: MigrationResult[] = [];

  // Migrate each association type
  const households = getHouseholdsForMigration(newUserId);
  results.push(await migrateAssociationType('households', households, api.createHousehold));

  const policies = getPoliciesForMigration(newUserId);
  results.push(await migrateAssociationType('policies', policies, api.createPolicy));

  const simulations = getSimulationsForMigration(newUserId);
  results.push(await migrateAssociationType('simulations', simulations, api.createSimulation));

  const reports = getReportsForMigration(newUserId);
  results.push(await migrateAssociationType('reports', reports, api.createReport));

  const geographies = getGeographiesForMigration(newUserId);
  results.push(await migrateAssociationType('geographies', geographies, api.createGeography));

  // Check if migration was successful (no critical errors)
  const totalErrors = results.reduce((sum, r) => sum + r.errorCount, 0);
  const success = totalErrors === 0;

  if (success) {
    // Clear localStorage and mark migration complete
    clearLocalStorageData();
    markMigrationComplete();
  }

  return {
    success,
    newUserId,
    startTime,
    endTime: new Date().toISOString(),
    results,
  };
}

// Export storage keys for testing
export { STORAGE_KEYS, OLD_MOCK_USER_ID };

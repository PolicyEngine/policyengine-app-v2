/**
 * User Identity Module
 *
 * Manages persistent anonymous user IDs stored in localStorage.
 * This ID is used to associate user-created records (households, policies,
 * simulations, reports, geographies) with the user across sessions.
 */

const USER_ID_STORAGE_KEY = 'policyengine_user_id';
const MIGRATION_COMPLETE_KEY = 'policyengine_migration_v2_complete';

/**
 * Gets the current user's ID, creating one if it doesn't exist.
 * The ID is a UUID stored in localStorage for persistence across sessions.
 *
 * @returns The user's unique identifier
 */
export function getUserId(): string {
  let userId = localStorage.getItem(USER_ID_STORAGE_KEY);
  if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem(USER_ID_STORAGE_KEY, userId);
  }
  return userId;
}

/**
 * Clears the user's ID from localStorage.
 * This will cause a new ID to be generated on the next call to getUserId().
 *
 * Use with caution - this will effectively create a "new user" who won't
 * have access to their previously created records.
 */
export function clearUserId(): void {
  localStorage.removeItem(USER_ID_STORAGE_KEY);
}

/**
 * Checks if the v2 migration has been completed.
 *
 * @returns true if migration is complete, false otherwise
 */
export function isMigrationComplete(): boolean {
  return localStorage.getItem(MIGRATION_COMPLETE_KEY) === 'true';
}

/**
 * Marks the v2 migration as complete.
 * This prevents the migration from running again on future page loads.
 */
export function markMigrationComplete(): void {
  localStorage.setItem(MIGRATION_COMPLETE_KEY, 'true');
}

/**
 * Clears the migration complete flag.
 * This will cause the migration to run again on the next page load.
 *
 * Use for testing or if migration needs to be re-run.
 */
export function clearMigrationFlag(): void {
  localStorage.removeItem(MIGRATION_COMPLETE_KEY);
}

// Export storage keys for testing purposes
export const STORAGE_KEYS = {
  USER_ID: USER_ID_STORAGE_KEY,
  MIGRATION_COMPLETE: MIGRATION_COMPLETE_KEY,
} as const;

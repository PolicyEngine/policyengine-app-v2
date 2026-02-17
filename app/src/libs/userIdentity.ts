/**
 * User Identity Module
 *
 * Manages persistent anonymous user IDs stored in localStorage.
 * This ID is used to associate user-created records (households, policies,
 * simulations, reports, geographies) with the user across sessions.
 */

const USER_ID_STORAGE_KEY = 'policyengine_user_id';

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

// Export storage keys for testing purposes
export const STORAGE_KEYS = {
  USER_ID: USER_ID_STORAGE_KEY,
} as const;

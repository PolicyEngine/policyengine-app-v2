/**
 * Maps API status values to user-friendly display labels
 *
 * Currently only maps 'pending' -> 'Computing' for better UX
 * Other statuses pass through unchanged
 */

type ApiStatus = 'pending' | 'complete' | 'error';
type DisplayStatus = 'Computing' | 'Complete' | 'Error';

/**
 * Mapping from API status to display-friendly status
 */
const STATUS_DISPLAY_MAP: Record<ApiStatus, DisplayStatus> = {
  pending: 'Computing',
  complete: 'Complete',
  error: 'Error',
};

/**
 * Converts an API status value to a user-friendly display label
 *
 * @param apiStatus - The status value from API ('pending' | 'complete' | 'error')
 * @returns User-friendly display label
 *
 * @example
 * getDisplayStatus('pending') // returns 'Computing'
 * getDisplayStatus('complete') // returns 'Complete'
 * getDisplayStatus('error') // returns 'Error'
 */
export function getDisplayStatus(apiStatus: ApiStatus): DisplayStatus {
  return STATUS_DISPLAY_MAP[apiStatus];
}

/**
 * Export the mapping for direct access if needed
 */
export { STATUS_DISPLAY_MAP };

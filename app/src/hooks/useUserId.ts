import { useMemo } from 'react';

import { getUserId } from '@/libs/userIdentity';

/**
 * React hook that provides the current user's persistent ID.
 *
 * The ID is stable across renders and sessions - it's stored in localStorage
 * and only generated once per browser.
 *
 * @returns The user's unique identifier
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const userId = useUserId();
 *   const { data } = useUserHouseholds(userId);
 *   // ...
 * }
 * ```
 */
export function useUserId(): string {
  return useMemo(() => getUserId(), []);
}

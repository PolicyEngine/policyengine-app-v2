import { useMemo } from 'react';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { byRecentUpdate } from '@/api/reformStore';
import { useV3SavedWork } from '@/hooks/useFlagshipStores';
import type { Reform } from '@/types/ingredients/Reform';

/**
 * The query key of this session's saved reforms in a country: the list
 * Your reforms shows and the draft's comparison picker offers, as the
 * reform store's `findMine` answers it. The scope is whose saved work it
 * is (see V3SavedWork).
 */
export function savedReformListKey(scope: string, countryId: string) {
  return ['reforms', scope, countryId] as const;
}

/**
 * Applies a change the reform store has just made to the cached list, so
 * the list is not read again for it: on the account, reading it is
 * `GET /v2/user-policies` and then each new reform's policy.
 *
 * The list keeps the time it was read: only the changed reform is newer
 * than that, so the list is still read again when it would have been
 * without the change (once older than the query's stale time), and
 * changes made in another tab or on another device still show. A list
 * that has not loaded, failed to, is being read or is marked to be read
 * again is read again instead: a read in flight may have started before
 * the change.
 */
async function changeCachedList(
  queryClient: QueryClient,
  listKey: readonly unknown[],
  change: (reforms: Reform[]) => Reform[]
): Promise<void> {
  const state = queryClient.getQueryState<Reform[]>(listKey);
  if (!state) {
    // Not cached: whatever shows the list next reads it from the store.
    return;
  }
  if (
    state.data === undefined ||
    state.status !== 'success' ||
    state.fetchStatus !== 'idle' ||
    state.isInvalidated
  ) {
    // A read in flight is cancelled first. Otherwise one with no list yet
    // would be reused rather than started again.
    await queryClient.cancelQueries({ queryKey: listKey, exact: true });
    await queryClient.invalidateQueries({ queryKey: listKey, exact: true });
    return;
  }
  queryClient.setQueryData<Reform[]>(listKey, change(state.data), {
    updatedAt: state.dataUpdatedAt,
  });
}

/**
 * Puts a reform as the store has just answered it (created, updated, or
 * found) into the session's cached list for its country: in place of what
 * it was, or added, ordered as the store lists them.
 */
export function writeSavedReform(
  queryClient: QueryClient,
  scope: string,
  saved: Reform
): Promise<void> {
  return changeCachedList(queryClient, savedReformListKey(scope, saved.countryId), (reforms) =>
    byRecentUpdate([...reforms.filter((reform) => reform.id !== saved.id), saved])
  );
}

/** Takes a reform the store reports it no longer has out of the session's cached list. */
export function removeMissingReform(
  queryClient: QueryClient,
  scope: string,
  countryId: string,
  reformId: string
): Promise<void> {
  return changeCachedList(queryClient, savedReformListKey(scope, countryId), (reforms) =>
    reforms.filter((reform) => reform.id !== reformId)
  );
}

/** What a save tells this session's cached list of saved reforms. */
export interface SavedReformListCache {
  /** The store created, updated or found this reform, as it now holds it. */
  writeSaved: (saved: Reform) => Promise<void>;
  /** The store no longer has this reform (deleted, or saved in another sign-in state). */
  removeMissing: (countryId: string, reformId: string) => Promise<void>;
}

/**
 * Keeps this session's cached list of saved reforms current after a save,
 * in place of reading it again. Works the same for every reform store.
 * Use it from the same render as the store that saves, so a session that
 * changes during the save does not get the other session's reform.
 */
export function useSavedReformListCache(): SavedReformListCache {
  const queryClient = useQueryClient();
  const { scope } = useV3SavedWork();
  return useMemo(
    () => ({
      writeSaved: (saved) => writeSavedReform(queryClient, scope, saved),
      removeMissing: (countryId, reformId) =>
        removeMissingReform(queryClient, scope, countryId, reformId),
    }),
    [queryClient, scope]
  );
}

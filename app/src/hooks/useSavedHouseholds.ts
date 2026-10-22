import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getSavedHouseholdStore,
  type ListedSavedHousehold,
  type SavedHousehold,
  type SavedHouseholdChanges,
  type SavedHouseholdStore,
} from '@/api/savedHouseholdStore';
import { useV3SavedWork } from '@/hooks/useFlagshipStores';
import type { Household } from '@/models/Household';

/**
 * v3's saved households for this session: in the account, signed in or
 * signed out as this browser's unauthenticated user. Without accounts
 * there are none, and nothing is saved anywhere else.
 */

/**
 * Cached saved households are scoped to whose they are (see V3SavedWork)
 * and to the country, as the store lists one country's saved households.
 */
export const savedHouseholdKeys = {
  all: (scope: string, countryId: string) => ['saved-households', scope, countryId] as const,
  list: (scope: string, countryId: string) =>
    ['saved-households', scope, countryId, 'list'] as const,
  one: (scope: string, countryId: string, savedHouseholdId: string) =>
    ['saved-households', scope, countryId, 'one', savedHouseholdId] as const,
};

const STALE_TIME = 5 * 60 * 1000;

/** Saving without accounts: v3 keeps no household in the browser. */
export class SavedHouseholdsUnavailableError extends Error {
  constructor() {
    super('Saved households need an account.');
    this.name = 'SavedHouseholdsUnavailableError';
  }
}

export function useSavedHouseholdStore(): {
  store: SavedHouseholdStore | null;
  scope: string;
  /** The country the store reads and writes; none without accounts. */
  countryId: string | null;
} {
  const { account, scope } = useV3SavedWork();
  return useMemo(
    () => ({
      store: getSavedHouseholdStore(account),
      scope,
      countryId: account?.countryId ?? null,
    }),
    [account, scope]
  );
}

function requireStore(store: SavedHouseholdStore | null): SavedHouseholdStore {
  if (!store) {
    throw new SavedHouseholdsUnavailableError();
  }
  return store;
}

/** This session's saved households, most recently updated first. */
export function useSavedHouseholds() {
  const { store, scope, countryId } = useSavedHouseholdStore();
  const query = useQuery({
    queryKey: savedHouseholdKeys.list(scope, countryId ?? ''),
    queryFn: () => requireStore(store).list(),
    enabled: !!store,
    staleTime: STALE_TIME,
  });
  return {
    /** Whether saved households exist here: only with accounts. */
    available: !!store,
    savedHouseholds: (query.data ?? []) as ListedSavedHousehold[],
    isLoading: !!store && query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/** One saved household with its household; null when it does not exist. */
export function useSavedHousehold(savedHouseholdId: string | undefined) {
  const { store, scope, countryId } = useSavedHouseholdStore();
  return useQuery({
    queryKey: savedHouseholdKeys.one(scope, countryId ?? '', savedHouseholdId ?? ''),
    queryFn: () => requireStore(store).get(savedHouseholdId!),
    enabled: !!store && !!savedHouseholdId,
    staleTime: STALE_TIME,
  });
}

/** Reads the session's saved households, the list and each one opened, again after a change. */
function useInvalidateSavedHouseholds() {
  const queryClient = useQueryClient();
  const { scope, countryId } = useSavedHouseholdStore();
  return () =>
    queryClient.invalidateQueries({ queryKey: savedHouseholdKeys.all(scope, countryId ?? '') });
}

export function useSaveHousehold() {
  const { store } = useSavedHouseholdStore();
  const invalidate = useInvalidateSavedHouseholds();
  return useMutation({
    mutationFn: ({ household, label }: { household: Household; label: string }) =>
      requireStore(store).save({ household, label }),
    onSuccess: invalidate,
  });
}

export function useRenameSavedHousehold() {
  const { store } = useSavedHouseholdStore();
  const invalidate = useInvalidateSavedHouseholds();
  return useMutation({
    mutationFn: ({ savedHouseholdId, label }: { savedHouseholdId: string; label: string }) =>
      requireStore(store).rename(savedHouseholdId, label),
    onSuccess: invalidate,
  });
}

export function useDeleteSavedHousehold() {
  const { store } = useSavedHouseholdStore();
  const invalidate = useInvalidateSavedHouseholds();
  return useMutation({
    mutationFn: (savedHouseholdId: string) => requireStore(store).remove(savedHouseholdId),
    onSuccess: invalidate,
  });
}

/** Saves changes to a saved household (its content, its label or both), keeping its id. */
export function useSaveHouseholdChanges() {
  const { store } = useSavedHouseholdStore();
  const invalidate = useInvalidateSavedHouseholds();
  return useMutation({
    mutationFn: ({ saved, changes }: { saved: SavedHousehold; changes: SavedHouseholdChanges }) =>
      requireStore(store).saveChanges(saved, changes),
    onSuccess: invalidate,
  });
}

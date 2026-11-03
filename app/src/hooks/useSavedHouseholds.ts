import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getSavedHouseholdStore,
  type SavedHousehold,
  type SavedHouseholdChanges,
  type SavedHouseholdStore,
  type StoredHouseholdCache,
} from '@/api/savedHouseholdStore';
import { useV3SavedWork } from '@/hooks/useFlagshipStores';
import type { Household } from '@/models/Household';
import type { AssociationCountryId } from '@/types/v2User';

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

/**
 * A stored household by its country and v2 id. Its content never changes,
 * so it is the same for every user and kept until unused for a while.
 */
const storedHouseholdKey = (countryId: string, householdId: string) =>
  ['stored-households', countryId, householdId] as const;
const STORED_HOUSEHOLD_GC_TIME = 30 * 60 * 1000;

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
  countryId: AssociationCountryId | null;
} {
  const { account, scope } = useV3SavedWork();
  const queryClient = useQueryClient();
  // Every store this session makes keeps stored households in the query
  // client, so the list, the picker and the save form fetch each once.
  const storedHouseholds = useMemo<StoredHouseholdCache>(
    () => ({
      get: (countryId, householdId, fetchHousehold) =>
        queryClient.fetchQuery({
          queryKey: storedHouseholdKey(countryId, householdId),
          queryFn: fetchHousehold,
          staleTime: Infinity,
          gcTime: STORED_HOUSEHOLD_GC_TIME,
        }),
      set: (countryId, householdId, household) => {
        queryClient.setQueryData(storedHouseholdKey(countryId, householdId), household);
      },
    }),
    [queryClient]
  );
  return useMemo(
    () => ({
      store: getSavedHouseholdStore(account, storedHouseholds),
      scope,
      countryId: account?.countryId ?? null,
    }),
    [account, scope, storedHouseholds]
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
    savedHouseholds: query.data ?? [],
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

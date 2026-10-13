import { useSyncExternalStore } from 'react';

/**
 * Account saves that failed after the thing being saved was created: a
 * policy, household or simulation exists on the PolicyEngine API, but
 * adding it to the signed-in user's account did not work — the account
 * was unavailable, the request was too large, the service was down. The
 * builder carries on with the created item, so the failure is reported
 * here (see useAccountSaveFailure) and shown by SaveFailureNotice, which
 * outlives the dialog or view that started the save.
 */

export interface SaveFailure {
  /** Changes with every report, so a repeat of the same message shows again. */
  id: number;
  message: string;
}

let current: SaveFailure | null = null;
let nextId = 1;
const listeners = new Set<() => void>();

function publish(next: SaveFailure | null): void {
  current = next;
  listeners.forEach((listener) => listener());
}

/** Reports that `what` (e.g. "policy") was created but not added to the account. */
export function reportSaveFailure(what: string, error: unknown): void {
  const reason = error instanceof Error && error.message ? ` ${error.message}` : '';
  publish({
    id: nextId++,
    message: `Your ${what} was created, but it could not be added to your account.${reason}`,
  });
}

export function dismissSaveFailure(): void {
  publish(null);
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The latest unacknowledged save failure, if any. */
export function useSaveFailure(): SaveFailure | null {
  return useSyncExternalStore(
    subscribe,
    () => current,
    () => null
  );
}

import { useSyncExternalStore } from 'react';

/**
 * The provision a pick just landed on. Picking a parameter anywhere — a
 * search result, a policy-tree row — adds it and asks the reform table
 * to bring its value into focus, so choosing a parameter and setting it
 * are one motion. The nonce lets picking the same parameter again
 * re-focus it. Page-session UI state: never persisted with the draft.
 */
export interface ProvisionFocus {
  path: string;
  nonce: number;
}

let focus: ProvisionFocus | null = null;
const listeners = new Set<() => void>();

export function focusProvision(path: string): void {
  focus = { path, nonce: (focus?.nonce ?? 0) + 1 };
  listeners.forEach((listener) => listener());
}

export function clearProvisionFocus(): void {
  if (focus !== null) {
    focus = null;
    listeners.forEach((listener) => listener());
  }
}

export function useProvisionFocus(): ProvisionFocus | null {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => focus,
    () => null
  );
}

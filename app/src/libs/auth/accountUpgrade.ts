import { useSyncExternalStore } from 'react';
import { upgradeAccount } from '@/api/v2Me';
import type { V2UserClient } from '@/api/v2UserClient';
import type { AssociationCountryId } from '@/types/v2User';
import { getBrowserUserId, replaceBrowserUserId } from './browserUser';

/**
 * The upgrade at sign-in. Signed out, saved work belongs to this browser's
 * unauthenticated user in the PolicyEngine API; signing in upgrades that
 * user (`POST /v2/me/upgrade`). On a first sign-in it becomes the account,
 * so everything saved stays where it is; for an existing account its work
 * moves into that account. Then the browser starts over with a new
 * unauthenticated user, so whoever is next here signed out starts empty.
 * A failed upgrade keeps the browser's user, so the next sign-in tries again.
 */

export interface AccountUpgradeNotice {
  kind: 'success' | 'failure';
  message: string;
  /** Runs the upgrade again; present after a failure. */
  retry: (() => void) | null;
}

let currentNotice: AccountUpgradeNotice | null = null;
const listeners = new Set<() => void>();

function publishNotice(notice: AccountUpgradeNotice | null): void {
  currentNotice = notice;
  listeners.forEach((listener) => listener());
}

export function dismissAccountUpgradeNotice(): void {
  publishNotice(null);
}

/** The notice after the upgrade, which outlives the callback page. */
export function useAccountUpgradeNotice(): AccountUpgradeNotice | null {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => currentNotice,
    () => null
  );
}

export const UPGRADE_SUCCESS_MESSAGE =
  'The reforms and reports you saved on this browser are now in your account.';

export const UPGRADE_FAILURE_MESSAGE =
  'The reforms and reports you saved on this browser could not be added to your account. They will be added the next time you sign in.';

export interface RunAccountUpgradeOptions {
  /** A client for the signed-in session. */
  client: V2UserClient;
  /** The country signed in from; a new account records it. */
  countryId: AssociationCountryId;
}

/**
 * Upgrades this browser's unauthenticated user into the signed-in account
 * and publishes a notice when work moved, or when the upgrade failed.
 */
export async function runAccountUpgrade(options: RunAccountUpgradeOptions): Promise<void> {
  try {
    const { outcome } = await upgradeAccount(options.client, options.countryId, getBrowserUserId());
    replaceBrowserUserId();
    publishNotice(
      outcome === 'none' ? null : { kind: 'success', message: UPGRADE_SUCCESS_MESSAGE, retry: null }
    );
  } catch (error) {
    console.error('[accountUpgrade] Upgrade failed:', error);
    publishNotice({
      kind: 'failure',
      message: UPGRADE_FAILURE_MESSAGE,
      retry: () => {
        dismissAccountUpgradeNotice();
        void runAccountUpgrade(options);
      },
    });
  }
}

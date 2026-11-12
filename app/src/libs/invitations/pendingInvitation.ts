import { isFlagshipShellEnvEnabled } from '@/libs/featureFlags';
import type { AssociationCountryId } from '@/types/v2User';

/**
 * The invitation token an invitee brought from the email's link. The link
 * is `<app>/invitations/accept#token=…`: the token sits in the URL fragment,
 * which browsers never send to a server. The app keeps it in
 * localStorage until the invitation is accepted or can no longer be, so
 * it survives the trip to Auth0 to sign in or sign up, and to Auth0's
 * verification email. The token is a credential: it is sent only to the
 * acceptance route, and never logged.
 */

export const PENDING_INVITATION_STORAGE_KEY = 'pe-pending-invitation';

/**
 * How long a saved token is kept: seven days, the longest an invitation
 * lasts (the Public API's default). A token saved longer ago has expired.
 */
export const PENDING_INVITATION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

/** The path the email's link opens, outside the country routes. */
export const INVITATION_LINK_PATH = '/invitations/accept';

interface SavedInvitation {
  token: string;
  savedAt: number;
}

function isSavedInvitation(value: unknown): value is SavedInvitation {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const { token, savedAt } = value as Record<string, unknown>;
  return typeof token === 'string' && token.length > 0 && typeof savedAt === 'number';
}

function readSavedInvitation(): SavedInvitation | null {
  try {
    const stored = localStorage.getItem(PENDING_INVITATION_STORAGE_KEY);
    const parsed: unknown = stored ? JSON.parse(stored) : null;
    return isSavedInvitation(parsed) ? parsed : null;
  } catch {
    // Storage blocked, or not JSON.
    return null;
  }
}

function removeSavedInvitation() {
  try {
    localStorage.removeItem(PENDING_INVITATION_STORAGE_KEY);
  } catch {
    // Storage blocked: nothing was saved.
  }
}

/** Saves `token`; false when storage is blocked. */
export function savePendingInvitationToken(token: string, now: number = Date.now()): boolean {
  try {
    localStorage.setItem(
      PENDING_INVITATION_STORAGE_KEY,
      JSON.stringify({ token, savedAt: now } satisfies SavedInvitation)
    );
    return true;
  } catch {
    return false;
  }
}

/** The saved token, or null when none is saved or it is too old to work. */
export function readPendingInvitationToken(now: number = Date.now()): string | null {
  const saved = readSavedInvitation();
  if (!saved) {
    return null;
  }
  if (now - saved.savedAt > PENDING_INVITATION_MAX_AGE_MS) {
    removeSavedInvitation();
    return null;
  }
  return saved.token;
}

/**
 * Forgets `token` once it is accepted or can no longer be. A newer token,
 * saved meanwhile from another link, stays.
 */
export function clearPendingInvitationToken(token: string): void {
  if (readSavedInvitation()?.token === token) {
    removeSavedInvitation();
  }
}

/**
 * Saves the token in this page's URL fragment (`#token=…`), if there is
 * one, and removes the fragment from the address bar and this history
 * entry. With storage blocked the fragment stays, so the page can still
 * accept the token while it is open. Returns the token, or null when the
 * fragment has none.
 */
export function takeInvitationTokenFromUrl(): string | null {
  const token = new URLSearchParams(window.location.hash.replace(/^#/, '')).get('token');
  if (!token) {
    return null;
  }
  if (savePendingInvitationToken(token)) {
    window.history.replaceState(
      window.history.state,
      '',
      `${window.location.pathname}${window.location.search}`
    );
  }
  return token;
}

/** The accept page in a country's workspace, where sign-in and acceptance happen. */
export function invitationAcceptPath(countryId: string): string {
  return `/${countryId}${INVITATION_LINK_PATH}`;
}

/**
 * The country whose workspace the link's page sends the invitee to: the
 * UK when the root page last detected it there (its `detectedCountry`
 * cache) and the UK's workspace is on, else the US.
 */
export function invitationCountry(): AssociationCountryId {
  try {
    const cached: unknown = JSON.parse(localStorage.getItem('detectedCountry') ?? 'null');
    const country =
      typeof cached === 'object' && cached !== null
        ? (cached as Record<string, unknown>).country
        : null;
    if (country === 'uk' && isFlagshipShellEnvEnabled('uk')) {
      return 'uk';
    }
  } catch {
    // Storage blocked, or not JSON.
  }
  return 'us';
}

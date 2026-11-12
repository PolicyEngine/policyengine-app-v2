import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  clearPendingInvitationToken,
  invitationAcceptPath,
  invitationCountry,
  PENDING_INVITATION_MAX_AGE_MS,
  PENDING_INVITATION_STORAGE_KEY,
  readPendingInvitationToken,
  savePendingInvitationToken,
  takeInvitationTokenFromUrl,
} from '@/libs/invitations/pendingInvitation';
import { INVITATION_TOKEN, OTHER_INVITATION_TOKEN } from '@/tests/fixtures/api/v2InvitationMocks';

const SAVED_AT = Date.parse('2026-11-12T10:00:00Z');

/** Puts the browser on `path` (with its query and fragment) without a navigation. */
function openAddress(path: string) {
  window.history.replaceState(null, '', path);
}

beforeEach(() => {
  localStorage.clear();
  openAddress('/');
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe('pendingInvitation', () => {
  test('given a saved token then it is read back until it is cleared', () => {
    // Given
    savePendingInvitationToken(INVITATION_TOKEN, SAVED_AT);

    // When
    const tokenBeforeClearing = readPendingInvitationToken(SAVED_AT + 1000);
    clearPendingInvitationToken(INVITATION_TOKEN);

    // Then
    expect(tokenBeforeClearing).toBe(INVITATION_TOKEN);
    expect(readPendingInvitationToken(SAVED_AT + 2000)).toBeNull();
  });

  test('given a token saved longer ago than an invitation lasts then it is dropped', () => {
    // Given
    savePendingInvitationToken(INVITATION_TOKEN, SAVED_AT);

    // When
    const token = readPendingInvitationToken(SAVED_AT + PENDING_INVITATION_MAX_AGE_MS + 1);

    // Then
    expect(token).toBeNull();
    expect(localStorage.getItem(PENDING_INVITATION_STORAGE_KEY)).toBeNull();
  });

  test('given a newer token was saved since then clearing the older one keeps the newer', () => {
    // Given
    savePendingInvitationToken(INVITATION_TOKEN, SAVED_AT);
    savePendingInvitationToken(OTHER_INVITATION_TOKEN, SAVED_AT + 1000);

    // When
    clearPendingInvitationToken(INVITATION_TOKEN);

    // Then
    expect(readPendingInvitationToken(SAVED_AT + 2000)).toBe(OTHER_INVITATION_TOKEN);
  });

  test('given stored data that is not a saved token then nothing is read', () => {
    // Given
    localStorage.setItem(PENDING_INVITATION_STORAGE_KEY, '{"token": 42}');

    // When
    const token = readPendingInvitationToken(SAVED_AT);

    // Then
    expect(token).toBeNull();
  });

  test('given the link carries a token in its fragment then it is saved and leaves the address bar', () => {
    // Given
    openAddress(`/invitations/accept?utm_source=email#token=${INVITATION_TOKEN}`);

    // When
    const token = takeInvitationTokenFromUrl();

    // Then
    expect(token).toBe(INVITATION_TOKEN);
    expect(readPendingInvitationToken()).toBe(INVITATION_TOKEN);
    expect(`${window.location.pathname}${window.location.search}${window.location.hash}`).toBe(
      '/invitations/accept?utm_source=email'
    );
  });

  test('given storage is blocked then the token is still returned and leaves the address bar', () => {
    // Given
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new Error('Storage is blocked');
    });
    openAddress(`/invitations/accept#token=${INVITATION_TOKEN}`);

    // When
    const token = takeInvitationTokenFromUrl();

    // Then
    expect(token).toBe(INVITATION_TOKEN);
    expect(window.location.hash).toBe('');
  });

  test('given no token in the fragment then a token saved earlier stays', () => {
    // Given
    savePendingInvitationToken(INVITATION_TOKEN);
    openAddress('/us/invitations/accept#section');

    // When
    const token = takeInvitationTokenFromUrl();

    // Then
    expect(token).toBeNull();
    expect(readPendingInvitationToken()).toBe(INVITATION_TOKEN);
    expect(window.location.hash).toBe('#section');
  });

  test('given a country then the accept page is under it', () => {
    // When
    const path = invitationAcceptPath('uk');

    // Then
    expect(path).toBe('/uk/invitations/accept');
  });

  test('given no country was detected then the invitation is accepted in the US', () => {
    // When
    const countryId = invitationCountry();

    // Then
    expect(countryId).toBe('us');
  });

  test('given the UK was detected and its workspace is on then the invitation is accepted in the UK', () => {
    // Given
    vi.stubEnv('VITE_FLAGSHIP_SHELL_UK', 'true');
    localStorage.setItem(
      'detectedCountry',
      JSON.stringify({ country: 'uk', timestamp: Date.now() })
    );

    // When
    const countryId = invitationCountry();

    // Then
    expect(countryId).toBe('uk');
  });

  test('given the UK was detected but its workspace is off then the invitation is accepted in the US', () => {
    // Given
    vi.stubEnv('VITE_FLAGSHIP_SHELL_UK', '');
    localStorage.setItem(
      'detectedCountry',
      JSON.stringify({ country: 'uk', timestamp: Date.now() })
    );

    // When
    const countryId = invitationCountry();

    // Then
    expect(countryId).toBe('us');
  });
});

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { getBrowserUserId, replaceBrowserUserId } from '@/libs/auth/browserUser';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('browserUser', () => {
  test('given a first visit then the browser gets a random user ID that it keeps', () => {
    // When
    const first = getBrowserUserId();

    // Then
    expect(first).toMatch(UUID_PATTERN);
    expect(getBrowserUserId()).toBe(first);
    expect(localStorage.getItem('pe-browser-user-id')).toBe(first);
  });

  test('given an upgrade then the browser starts over with a new user ID', () => {
    // Given
    const before = getBrowserUserId();

    // When
    const after = replaceBrowserUserId();

    // Then
    expect(after).toMatch(UUID_PATTERN);
    expect(after).not.toBe(before);
    expect(getBrowserUserId()).toBe(after);
  });

  test('given storage is unavailable then one ID serves the rest of the page', () => {
    // Given
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    // When
    const first = getBrowserUserId();

    // Then
    expect(first).toMatch(UUID_PATTERN);
    expect(getBrowserUserId()).toBe(first);
  });

  test('given a browser without crypto.randomUUID then it still gets a random user ID', () => {
    // Given: randomUUID needs a secure context; getRandomValues does not
    const realCrypto = globalThis.crypto;
    vi.stubGlobal('crypto', {
      getRandomValues: (bytes: Uint8Array) => realCrypto.getRandomValues(bytes),
    });

    try {
      // When
      const userId = getBrowserUserId();

      // Then
      expect(userId).toMatch(UUID_PATTERN);
      expect(getBrowserUserId()).toBe(userId);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  test('given a damaged stored ID then the browser gets a new one the API accepts', () => {
    // Given
    localStorage.setItem('pe-browser-user-id', 'not-a-uuid');

    // When
    const userId = getBrowserUserId();

    // Then
    expect(userId).toMatch(UUID_PATTERN);
    expect(localStorage.getItem('pe-browser-user-id')).toBe(userId);
  });
});

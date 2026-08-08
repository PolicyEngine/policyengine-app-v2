import { afterEach, describe, expect, test } from 'vitest';
import { isFlagshipShellEnabled, setFlagshipShellEnabled } from '@/libs/featureFlags';

describe('featureFlags', () => {
  afterEach(() => {
    setFlagshipShellEnabled(false);
  });

  test('given no override then flagship shell is off by default', () => {
    expect(isFlagshipShellEnabled()).toBe(false);
  });

  test('given the localStorage override is set then flagship shell is on', () => {
    setFlagshipShellEnabled(true);
    expect(isFlagshipShellEnabled()).toBe(true);
  });

  test('given the override is cleared then flagship shell is off again', () => {
    setFlagshipShellEnabled(true);
    setFlagshipShellEnabled(false);
    expect(isFlagshipShellEnabled()).toBe(false);
  });

  test('given arbitrary junk in the storage key then flagship shell stays off', () => {
    localStorage.setItem('pe-flagship-shell', 'yes-please');
    expect(isFlagshipShellEnabled()).toBe(false);
  });
});

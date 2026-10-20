import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { isFlagshipShellEnabled, setFlagshipShellEnabled } from '@/libs/featureFlags';

describe('featureFlags', () => {
  test('given no flag then the flagship shell is the default', () => {
    expect(isFlagshipShellEnabled()).toBe(true);
  });

  test('given the UK with no flag of its own then it stays on v2, while the US is on v3', () => {
    expect(isFlagshipShellEnabled('uk')).toBe(false);
    expect(isFlagshipShellEnabled('us')).toBe(true);
  });

  test('given the UK flag set to true then the UK is on v3', () => {
    vi.stubEnv('NEXT_PUBLIC_FLAGSHIP_SHELL_UK', 'true');
    expect(isFlagshipShellEnabled('uk')).toBe(true);
    vi.unstubAllEnvs();
  });

  test('given the flag set to false then the v2 app is back', () => {
    vi.stubEnv('VITE_FLAGSHIP_SHELL', 'false');
    expect(isFlagshipShellEnabled()).toBe(false);
    vi.unstubAllEnvs();
    vi.stubEnv('NEXT_PUBLIC_FLAGSHIP_SHELL', 'false');
    expect(isFlagshipShellEnabled()).toBe(false);
  });
});

// The localStorage override only matters on a build that turns the shell off.
describe('featureFlags override on a flag-off build', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_FLAGSHIP_SHELL', 'false');
  });

  afterEach(() => {
    setFlagshipShellEnabled(false);
    vi.unstubAllEnvs();
  });

  test('given a deployment that does not allow the override then localStorage cannot enable the shell', () => {
    // Neutralize the dev default so this behaves like a production build.
    vi.stubEnv('VITE_FLAGSHIP_OVERRIDE', '');
    vi.stubEnv('VITE_FLAGSHIP_SHELL', 'false');
    setFlagshipShellEnabled(true);

    expect(isFlagshipShellEnabled()).toBe(false);
  });

  test('given a deployment that allows the override then localStorage enables the shell', () => {
    vi.stubEnv('VITE_FLAGSHIP_OVERRIDE', 'allow');
    vi.stubEnv('VITE_FLAGSHIP_SHELL', 'false');
    setFlagshipShellEnabled(true);

    expect(isFlagshipShellEnabled()).toBe(true);
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

  test('given the US override then the UK keeps its own, and the reverse', () => {
    vi.stubEnv('VITE_FLAGSHIP_OVERRIDE', 'allow');
    setFlagshipShellEnabled(true);
    expect(isFlagshipShellEnabled('us')).toBe(true);
    expect(isFlagshipShellEnabled('uk')).toBe(false);

    setFlagshipShellEnabled(false);
    setFlagshipShellEnabled(true, 'uk');
    expect(isFlagshipShellEnabled('uk')).toBe(true);
    expect(isFlagshipShellEnabled('us')).toBe(false);
    setFlagshipShellEnabled(false, 'uk');
  });
});

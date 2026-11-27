import { afterEach, describe, expect, test, vi } from 'vitest';
import { isExploreEnabled, setExploreEnabled } from '@/libs/featureFlags';

describe('isExploreEnabled', () => {
  afterEach(() => {
    setExploreEnabled(false);
    vi.unstubAllEnvs();
  });

  test('given no flag then Explore is off', () => {
    expect(isExploreEnabled('us')).toBe(false);
  });

  test('given the build flag then Explore is on for the US only', () => {
    vi.stubEnv('NEXT_PUBLIC_EXPLORE', 'true');

    expect(isExploreEnabled('us')).toBe(true);
    expect(isExploreEnabled('uk')).toBe(false);
  });

  test('given a deployment that allows the override then localStorage turns it on', () => {
    vi.stubEnv('VITE_FLAGSHIP_OVERRIDE', 'allow');
    setExploreEnabled(true);

    expect(isExploreEnabled('us')).toBe(true);
  });

  test('given a deployment that does not allow the override then localStorage cannot turn it on', () => {
    vi.stubEnv('VITE_FLAGSHIP_OVERRIDE', '');
    vi.stubEnv('NODE_ENV', 'production');
    setExploreEnabled(true);

    expect(isExploreEnabled('us')).toBe(false);
  });

  test('given the v2 app then Explore is off, whatever its own flag says', () => {
    vi.stubEnv('NEXT_PUBLIC_EXPLORE', 'true');
    vi.stubEnv('NEXT_PUBLIC_FLAGSHIP_SHELL', 'false');

    expect(isExploreEnabled('us')).toBe(false);
  });
});

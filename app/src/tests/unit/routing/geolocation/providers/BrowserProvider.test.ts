import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { BrowserProvider } from '@/routing/geolocation/providers/BrowserProvider';

describe('BrowserProvider', () => {
  let originalNavigator: Navigator;

  beforeEach(() => {
    originalNavigator = global.navigator;
  });

  afterEach(() => {
    global.navigator = originalNavigator;
  });

  test('given language with country code then returns country code', async () => {
    // Given
    Object.defineProperty(global.navigator, 'language', {
      value: 'en-US',
      configurable: true,
    });
    const provider = new BrowserProvider();

    // When
    const result = await provider.detect();

    // Then
    expect(result).toBe('US');
  });

  test('given language with lowercase country code then returns uppercase', async () => {
    // Given
    Object.defineProperty(global.navigator, 'language', {
      value: 'en-gb',
      configurable: true,
    });
    const provider = new BrowserProvider();

    // When
    const result = await provider.detect();

    // Then
    expect(result).toBe('GB');
  });

  test('given French language then maps to CA', async () => {
    // Given
    Object.defineProperty(global.navigator, 'language', {
      value: 'fr',
      configurable: true,
    });
    const provider = new BrowserProvider();

    // When
    const result = await provider.detect();

    // Then
    expect(result).toBe('CA');
  });

  test('given English without country then maps to US', async () => {
    // Given
    Object.defineProperty(global.navigator, 'language', {
      value: 'en',
      configurable: true,
    });
    const provider = new BrowserProvider();

    // When
    const result = await provider.detect();

    // Then
    expect(result).toBe('US');
  });

  test('given Hebrew language then maps to IL', async () => {
    // Given
    Object.defineProperty(global.navigator, 'language', {
      value: 'he',
      configurable: true,
    });
    const provider = new BrowserProvider();

    // When
    const result = await provider.detect();

    // Then
    expect(result).toBe('IL');
  });

  test('given language with multiple hyphens then extracts country', async () => {
    // Given
    Object.defineProperty(global.navigator, 'language', {
      value: 'zh-Hans-CN',
      configurable: true,
    });
    const provider = new BrowserProvider();

    // When
    const result = await provider.detect();

    // Then
    expect(result).toBe('HANS');
  });

  test('given unmapped language then returns null', async () => {
    // Given
    Object.defineProperty(global.navigator, 'language', {
      value: 'xx',
      configurable: true,
    });
    const provider = new BrowserProvider();

    // When
    const result = await provider.detect();

    // Then
    expect(result).toBeNull();
  });

  test('given no language then returns null', async () => {
    // Given
    Object.defineProperty(global.navigator, 'language', {
      value: undefined,
      configurable: true,
    });
    const provider = new BrowserProvider();

    // When
    const result = await provider.detect();

    // Then
    expect(result).toBeNull();
  });

  test('given userLanguage fallback then uses userLanguage', async () => {
    // Given
    Object.defineProperty(global.navigator, 'language', {
      value: undefined,
      configurable: true,
    });
    Object.defineProperty(global.navigator, 'userLanguage', {
      value: 'en-GB',
      configurable: true,
    });
    const provider = new BrowserProvider();

    // When
    const result = await provider.detect();

    // Then
    expect(result).toBe('GB');
  });

  test('given provider name then returns correct name', () => {
    // Given
    const provider = new BrowserProvider();

    // When / Then
    expect(provider.name).toBe('Browser');
  });

  test('given provider priority then returns lowest priority', () => {
    // Given
    const provider = new BrowserProvider();

    // When / Then
    expect(provider.priority).toBe(3);
  });
});

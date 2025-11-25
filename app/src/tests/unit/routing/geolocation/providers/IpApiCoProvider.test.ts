import { beforeEach, describe, expect, test, vi } from 'vitest';
import { IpApiCoProvider } from '@/routing/geolocation/providers/IpApiCoProvider';

describe('IpApiCoProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('given successful API response then returns country code', async () => {
    // Given
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue('US'),
    });
    const provider = new IpApiCoProvider();

    // When
    const result = await provider.detect();

    // Then
    expect(result).toBe('US');
    expect(fetch).toHaveBeenCalledWith(
      'https://ipapi.co/country_code/',
      expect.objectContaining({
        method: 'GET',
        headers: { Accept: 'text/plain' },
      })
    );
  });

  test('given country code with whitespace then returns trimmed code', async () => {
    // Given
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue('  GB  \n'),
    });
    const provider = new IpApiCoProvider();

    // When
    const result = await provider.detect();

    // Then
    expect(result).toBe('GB');
  });

  test('given API key then includes key in request', async () => {
    // Given
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue('US'),
    });
    const apiKey = 'test-api-key';
    const provider = new IpApiCoProvider(apiKey);

    // When
    await provider.detect();

    // Then
    expect(fetch).toHaveBeenCalledWith(
      'https://ipapi.co/country_code/?key=test-api-key',
      expect.any(Object)
    );
  });

  test('given API error response then returns null', async () => {
    // Given
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
    });
    const provider = new IpApiCoProvider();

    // When
    const result = await provider.detect();

    // Then
    expect(result).toBeNull();
  });

  test('given network timeout then returns null', async () => {
    // Given
    global.fetch = vi.fn().mockRejectedValue(new Error('Timeout'));
    const provider = new IpApiCoProvider();

    // When
    const result = await provider.detect();

    // Then
    expect(result).toBeNull();
  });

  test('given invalid country code format then returns null', async () => {
    // Given
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue('INVALID'),
    });
    const provider = new IpApiCoProvider();

    // When
    const result = await provider.detect();

    // Then
    expect(result).toBeNull();
  });

  test('given empty response then returns null', async () => {
    // Given
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue(''),
    });
    const provider = new IpApiCoProvider();

    // When
    const result = await provider.detect();

    // Then
    expect(result).toBeNull();
  });

  test('given provider name then returns correct name', () => {
    // Given
    const provider = new IpApiCoProvider();

    // When / Then
    expect(provider.name).toBe('ipapi.co');
  });

  test('given provider priority then returns highest priority', () => {
    // Given
    const provider = new IpApiCoProvider();

    // When / Then
    expect(provider.priority).toBe(1);
  });
});

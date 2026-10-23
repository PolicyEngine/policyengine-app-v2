import { beforeEach, describe, expect, test, vi } from 'vitest';
import { VercelIpCountryProvider } from '@/routing/geolocation/providers/VercelIpCountryProvider';

describe('VercelIpCountryProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('given successful API response then returns country code', async () => {
    // Given
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue('US'),
    });
    const provider = new VercelIpCountryProvider();

    // When
    const result = await provider.detect();

    // Then
    expect(result).toBe('US');
    expect(fetch).toHaveBeenCalledWith(
      '/api/geolocate',
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
    const provider = new VercelIpCountryProvider();

    // When
    const result = await provider.detect();

    // Then
    expect(result).toBe('GB');
  });

  test('given custom route URL then uses it', async () => {
    // Given
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue('US'),
    });
    const provider = new VercelIpCountryProvider('/custom/geolocate');

    // When
    await provider.detect();

    // Then
    expect(fetch).toHaveBeenCalledWith('/custom/geolocate', expect.any(Object));
  });

  test('given route responds 204 because the country is unknown then returns null', async () => {
    // Given
    global.fetch = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    const provider = new VercelIpCountryProvider();

    // When
    const result = await provider.detect();

    // Then
    expect(result).toBeNull();
  });

  test('given API error response then returns null', async () => {
    // Given
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
    });
    const provider = new VercelIpCountryProvider();

    // When
    const result = await provider.detect();

    // Then
    expect(result).toBeNull();
  });

  test('given network timeout then returns null', async () => {
    // Given
    global.fetch = vi.fn().mockRejectedValue(new Error('Timeout'));
    const provider = new VercelIpCountryProvider();

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
    const provider = new VercelIpCountryProvider();

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
    const provider = new VercelIpCountryProvider();

    // When
    const result = await provider.detect();

    // Then
    expect(result).toBeNull();
  });

  test('given provider name then returns correct name', () => {
    // Given
    const provider = new VercelIpCountryProvider();

    // When / Then
    expect(provider.name).toBe('Vercel IP country');
  });

  test('given provider priority then returns highest priority', () => {
    // Given
    const provider = new VercelIpCountryProvider();

    // When / Then
    expect(provider.priority).toBe(1);
  });
});

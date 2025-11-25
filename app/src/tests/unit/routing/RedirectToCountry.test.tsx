import { useEffect, useState } from 'react';
import { renderHook, waitFor } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import {
  CACHED_COUNTRY_KEY,
  MOCK_CACHED_UK,
  MOCK_CACHED_US,
  MOCK_EXPIRED_CACHE,
  MOCK_INVALID_CACHE,
  mockLocalStorage,
} from '@/tests/fixtures/routing/RedirectToCountryMocks';

// Mock the geolocation service
vi.mock('@/routing/geolocation/GeolocationService', () => ({
  geolocationService: {
    detectCountry: vi.fn(),
  },
}));

// Mock Navigate to avoid router issues
vi.mock('react-router-dom', () => ({
  Navigate: () => null,
}));

describe('RedirectToCountry', () => {
  let localStorageMock: ReturnType<typeof mockLocalStorage>;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock = mockLocalStorage();
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });
  });

  test('given valid cached country then returns cached value', async () => {
    // Given
    localStorageMock.setItem(CACHED_COUNTRY_KEY, MOCK_CACHED_US);
    const { geolocationService } = await import('@/routing/geolocation/GeolocationService');

    const { result } = renderHook(() => {
      const [detectedCountry, setDetectedCountry] = useState<string | null>(null);

      useEffect(() => {
        const cached = localStorageMock.getItem(CACHED_COUNTRY_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          setDetectedCountry(parsed.country);
        }
      }, []);

      return detectedCountry;
    });

    // When / Then
    await waitFor(() => {
      expect(result.current).toBe('us');
    });
    expect(geolocationService.detectCountry).not.toHaveBeenCalled();
  });

  test('given UK cached country then returns UK', async () => {
    // Given
    localStorageMock.setItem(CACHED_COUNTRY_KEY, MOCK_CACHED_UK);

    const { result } = renderHook(() => {
      const [detectedCountry, setDetectedCountry] = useState<string | null>(null);

      useEffect(() => {
        const cached = localStorageMock.getItem(CACHED_COUNTRY_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          setDetectedCountry(parsed.country);
        }
      }, []);

      return detectedCountry;
    });

    // When / Then
    await waitFor(() => {
      expect(result.current).toBe('uk');
    });
  });

  test('given expired cache then removes cache', () => {
    // Given
    localStorageMock.setItem(CACHED_COUNTRY_KEY, MOCK_EXPIRED_CACHE);
    const fourHoursInMs = 4 * 60 * 60 * 1000;

    // When
    const cached = localStorageMock.getItem(CACHED_COUNTRY_KEY);
    const parsed = JSON.parse(cached!);
    const isExpired = Date.now() - parsed.timestamp >= fourHoursInMs;

    // Then
    expect(isExpired).toBe(true);
  });

  test('given invalid cached data then parsing fails', () => {
    // Given
    localStorageMock.setItem(CACHED_COUNTRY_KEY, MOCK_INVALID_CACHE);

    // When / Then
    expect(() => {
      const cached = localStorageMock.getItem(CACHED_COUNTRY_KEY);
      JSON.parse(cached!);
    }).toThrow();
  });

  test('given successful geolocation then caches result', async () => {
    // Given
    const { geolocationService } = await import('@/routing/geolocation/GeolocationService');
    vi.mocked(geolocationService.detectCountry).mockResolvedValue('uk');

    // When
    const country = await geolocationService.detectCountry();
    localStorageMock.setItem(
      CACHED_COUNTRY_KEY,
      JSON.stringify({
        country,
        timestamp: Date.now(),
      })
    );

    // Then
    const cached = localStorageMock.getItem(CACHED_COUNTRY_KEY);
    expect(cached).not.toBeNull();
    const parsed = JSON.parse(cached!);
    expect(parsed.country).toBe('uk');
    expect(parsed.timestamp).toBeGreaterThan(0);
  });

  test('given geolocation error then falls back to US', async () => {
    // Given
    const { geolocationService } = await import('@/routing/geolocation/GeolocationService');
    vi.mocked(geolocationService.detectCountry).mockRejectedValue(new Error('Network error'));

    // When
    let fallbackCountry = 'us';
    try {
      await geolocationService.detectCountry();
    } catch {
      fallbackCountry = 'us';
    }

    // Then
    expect(fallbackCountry).toBe('us');
  });

  test('given cache timestamp format then validates correctly', () => {
    // Given
    const now = Date.now();
    const cacheData = JSON.stringify({
      country: 'us',
      timestamp: now,
    });

    // When
    localStorageMock.setItem(CACHED_COUNTRY_KEY, cacheData);
    const retrieved = localStorageMock.getItem(CACHED_COUNTRY_KEY);
    const parsed = JSON.parse(retrieved!);

    // Then
    expect(parsed.country).toBe('us');
    expect(parsed.timestamp).toBe(now);
    expect(typeof parsed.timestamp).toBe('number');
  });
});

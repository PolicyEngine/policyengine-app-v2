import { describe, expect, test } from 'vitest';
import { GeolocationService } from '@/routing/geolocation/GeolocationService';
import {
  MOCK_UK_COUNTRY_CODE,
  MOCK_UK_ROUTE,
  MOCK_US_COUNTRY_CODE,
  MOCK_US_ROUTE,
  MockErrorProvider,
  MockFailProvider,
  MockSuccessProvider,
} from '@/tests/fixtures/routing/geolocation/GeolocationServiceMocks';

describe('GeolocationService', () => {
  test('given successful provider then returns mapped country code', async () => {
    // Given
    const service = new GeolocationService();
    // @ts-expect-error - Accessing private property for testing
    service.providers = [new MockSuccessProvider(MOCK_US_COUNTRY_CODE)];

    // When
    const result = await service.detectCountry();

    // Then
    expect(result).toBe(MOCK_US_ROUTE);
  });

  test('given UK country code then returns uk route', async () => {
    // Given
    const service = new GeolocationService();
    // @ts-expect-error - Accessing private property for testing
    service.providers = [new MockSuccessProvider(MOCK_UK_COUNTRY_CODE)];

    // When
    const result = await service.detectCountry();

    // Then
    expect(result).toBe(MOCK_UK_ROUTE);
  });

  test('given first provider fails then tries second provider', async () => {
    // Given
    const service = new GeolocationService();
    // @ts-expect-error - Accessing private property for testing
    service.providers = [new MockFailProvider(), new MockSuccessProvider(MOCK_US_COUNTRY_CODE)];

    // When
    const result = await service.detectCountry();

    // Then
    expect(result).toBe(MOCK_US_ROUTE);
  });

  test('given provider throws error then tries next provider', async () => {
    // Given
    const service = new GeolocationService();
    // @ts-expect-error - Accessing private property for testing
    service.providers = [new MockErrorProvider(), new MockSuccessProvider(MOCK_US_COUNTRY_CODE)];

    // When
    const result = await service.detectCountry();

    // Then
    expect(result).toBe(MOCK_US_ROUTE);
  });

  test('given all providers fail then returns default country', async () => {
    // Given
    const service = new GeolocationService();
    // @ts-expect-error - Accessing private property for testing
    service.providers = [new MockFailProvider(), new MockErrorProvider()];

    // When
    const result = await service.detectCountry();

    // Then
    expect(result).toBe('us'); // Default country
  });

  test('given unsupported country code then returns default country', async () => {
    // Given
    const service = new GeolocationService();
    // @ts-expect-error - Accessing private property for testing
    service.providers = [new MockSuccessProvider('ZZ')]; // Invalid country code

    // When
    const result = await service.detectCountry();

    // Then
    expect(result).toBe('us'); // Default country
  });

  test('given providers in wrong order then sorts by priority', () => {
    // Given
    const lowPriorityProvider = new MockSuccessProvider(MOCK_US_COUNTRY_CODE);
    lowPriorityProvider.priority = 10;

    const highPriorityProvider = new MockSuccessProvider(MOCK_UK_COUNTRY_CODE);
    highPriorityProvider.priority = 1;

    const service = new GeolocationService();
    // @ts-expect-error - Accessing private property for testing
    service.providers = [lowPriorityProvider, highPriorityProvider];

    // When
    // @ts-expect-error - Accessing private property for testing
    service.providers.sort((a, b) => a.priority - b.priority);

    // Then
    // @ts-expect-error - Accessing private property for testing
    expect(service.providers[0]).toBe(highPriorityProvider);
    // @ts-expect-error - Accessing private property for testing
    expect(service.providers[1]).toBe(lowPriorityProvider);
  });
});

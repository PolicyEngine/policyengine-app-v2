import { beforeEach, describe, expect, test, vi } from 'vitest';
import { fetchCountries } from '@/api/countries';
import { BASE_URL } from '@/constants';
import {
  COUNTRY_WITHOUT_APP_SUPPORT_PAYLOAD,
  mockCountriesBody,
  mockCountriesResponse,
  SOCIETY_WIDE_COUNTRIES,
  UNITED_KINGDOM_PAYLOAD,
  UNITED_STATES_PAYLOAD,
} from '@/tests/fixtures/api/countriesMocks';

const HTTP_SERVICE_UNAVAILABLE = 503;

describe('fetchCountries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('given the Public API lists countries then returns them with camel-case capability flags', async () => {
    // Given
    const fetchImplementation = vi
      .fn()
      .mockResolvedValue(mockCountriesResponse([UNITED_KINGDOM_PAYLOAD, UNITED_STATES_PAYLOAD]));

    // When
    const countries = await fetchCountries(fetchImplementation);

    // Then
    expect(countries).toEqual(SOCIETY_WIDE_COUNTRIES);
    expect(fetchImplementation).toHaveBeenCalledWith(`${BASE_URL}/v2/countries`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
  });

  test('given a country the app has no code for then it is still returned', async () => {
    // Given
    const fetchImplementation = vi
      .fn()
      .mockResolvedValue(mockCountriesResponse([COUNTRY_WITHOUT_APP_SUPPORT_PAYLOAD]));

    // When
    const countries = await fetchCountries(fetchImplementation);

    // Then
    expect(countries.map((country) => country.id)).toEqual(['be']);
  });

  test('given an error status then rejects', async () => {
    // Given
    const fetchImplementation = vi
      .fn()
      .mockResolvedValue(
        mockCountriesBody({ status: 'error', message: 'down' }, HTTP_SERVICE_UNAVAILABLE)
      );

    // When / Then
    await expect(fetchCountries(fetchImplementation)).rejects.toThrow(
      'Failed to fetch countries: HTTP 503'
    );
  });

  test('given an item without capability flags then rejects', async () => {
    // Given
    const fetchImplementation = vi.fn().mockResolvedValue(
      mockCountriesBody({
        status: 'ok',
        message: null,
        result: { items: [{ id: 'us', name: 'United States' }] },
      })
    );

    // When / Then
    await expect(fetchCountries(fetchImplementation)).rejects.toThrow(
      'Unexpected countries response'
    );
  });
});

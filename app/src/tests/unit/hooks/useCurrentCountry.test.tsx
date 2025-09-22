import { renderHook } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import {
  createRouterWrapper,
  TEST_COUNTRIES,
  TEST_PATHS,
} from '@/tests/fixtures/hooks/useCurrentCountryMocks';

describe('useCurrentCountry', () => {
  test('given valid country in URL then returns country ID', () => {
    // Given
    const wrapper = createRouterWrapper(TEST_PATHS.UK_POLICIES);

    // When
    const { result } = renderHook(() => useCurrentCountry(), { wrapper });

    // Then
    expect(result.current).toBe(TEST_COUNTRIES.UK);
  });

  test('given US country in URL then returns us', () => {
    // Given
    const wrapper = createRouterWrapper(TEST_PATHS.US_HOUSEHOLD);

    // When
    const { result } = renderHook(() => useCurrentCountry(), { wrapper });

    // Then
    expect(result.current).toBe(TEST_COUNTRIES.US);
  });

  test('given Canada country in URL then returns ca', () => {
    // Given
    const wrapper = createRouterWrapper(TEST_PATHS.CA_ABOUT);

    // When
    const { result } = renderHook(() => useCurrentCountry(), { wrapper });

    // Then
    expect(result.current).toBe(TEST_COUNTRIES.CA);
  });

  test('given invalid country in URL then returns us as fallback', () => {
    // Given
    const wrapper = createRouterWrapper(TEST_PATHS.INVALID_COUNTRY_POLICIES);

    // When
    const { result } = renderHook(() => useCurrentCountry(), { wrapper });

    // Then
    expect(result.current).toBe(TEST_COUNTRIES.US);
  });

  test('given no country in URL then returns us as fallback', () => {
    // Given
    const wrapper = createRouterWrapper(TEST_PATHS.ROOT);

    // When
    const { result } = renderHook(() => useCurrentCountry(), { wrapper });

    // Then
    expect(result.current).toBe(TEST_COUNTRIES.US);
  });
});

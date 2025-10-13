import { renderHook } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, test } from 'vitest';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { TEST_COUNTRIES, TEST_PATHS } from '@/tests/fixtures/hooks/useCurrentCountryMocks';

/**
 * Helper to create a router wrapper for testing
 * @param initialPath - The path to initialize the router with
 */
function createRouterWrapper(initialPath: string) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/:countryId/*" element={children} />
          <Route path="/*" element={children} />
        </Routes>
      </MemoryRouter>
    );
  };
}

describe('useCurrentCountry', () => {
  describe('Reading from URL Parameter', () => {
    test('given UK in URL then returns uk', () => {
      // Given
      const wrapper = createRouterWrapper(TEST_PATHS.UK_POLICIES);

      // When
      const { result } = renderHook(() => useCurrentCountry(), { wrapper });

      // Then
      expect(result.current).toBe(TEST_COUNTRIES.UK);
    });

    test('given US in URL then returns us', () => {
      // Given
      const wrapper = createRouterWrapper(TEST_PATHS.US_HOUSEHOLD);

      // When
      const { result } = renderHook(() => useCurrentCountry(), { wrapper });

      // Then
      expect(result.current).toBe(TEST_COUNTRIES.US);
    });

    test('given CA in URL then returns ca', () => {
      // Given
      const wrapper = createRouterWrapper(TEST_PATHS.CA_ABOUT);

      // When
      const { result } = renderHook(() => useCurrentCountry(), { wrapper });

      // Then
      expect(result.current).toBe(TEST_COUNTRIES.CA);
    });

    test('given NG in URL then returns ng', () => {
      // Given
      const wrapper = createRouterWrapper('/ng/reports');

      // When
      const { result } = renderHook(() => useCurrentCountry(), { wrapper });

      // Then
      expect(result.current).toBe(TEST_COUNTRIES.NG);
    });

    test('given IL in URL then returns il', () => {
      // Given
      const wrapper = createRouterWrapper('/il/policies');

      // When
      const { result } = renderHook(() => useCurrentCountry(), { wrapper });

      // Then
      expect(result.current).toBe(TEST_COUNTRIES.IL);
    });
  });

  describe('Error Handling', () => {
    test('given no country in URL then throws error', () => {
      // Given
      const wrapper = createRouterWrapper(TEST_PATHS.ROOT);

      // When/Then
      expect(() => {
        renderHook(() => useCurrentCountry(), { wrapper });
      }).toThrow('useCurrentCountry must be used within country routes');
    });

    test('given invalid country in URL then throws error', () => {
      // Given
      const wrapper = createRouterWrapper(TEST_PATHS.INVALID_COUNTRY_POLICIES);

      // When/Then
      expect(() => {
        renderHook(() => useCurrentCountry(), { wrapper });
      }).toThrow('useCurrentCountry must be used within country routes');
    });

    test('given invalid country then error message includes country ID', () => {
      // Given
      const wrapper = createRouterWrapper('/xyz/policies');

      // When/Then
      expect(() => {
        renderHook(() => useCurrentCountry(), { wrapper });
      }).toThrow('Got countryId: xyz');
    });
  });

  describe('URL Changes', () => {
    test('given URL change then returns new country', () => {
      // Given - Start with UK
      const wrapper = createRouterWrapper(TEST_PATHS.UK_POLICIES);
      const { result, rerender } = renderHook(() => useCurrentCountry(), { wrapper });
      expect(result.current).toBe(TEST_COUNTRIES.UK);

      // When - Change to wrapper with US URL
      const newWrapper = createRouterWrapper(TEST_PATHS.US_HOUSEHOLD);
      renderHook(() => useCurrentCountry(), { wrapper: newWrapper });

      // Then - New hook instance returns US
      const { result: newResult } = renderHook(() => useCurrentCountry(), { wrapper: newWrapper });
      expect(newResult.current).toBe(TEST_COUNTRIES.US);
    });
  });

  describe('Type Safety', () => {
    test('given valid country then returns typed country ID', () => {
      // Given
      const wrapper = createRouterWrapper(TEST_PATHS.UK_POLICIES);

      // When
      const { result } = renderHook(() => useCurrentCountry(), { wrapper });

      // Then - Type should be inferred correctly (compile-time check)
      const country: 'us' | 'uk' | 'ca' | 'ng' | 'il' = result.current;
      expect(country).toBe(TEST_COUNTRIES.UK);
    });
  });

  describe('Integration with CountryGuard', () => {
    test('given CountryGuard validated URL then hook returns country', () => {
      // Given - Simulating what happens after CountryGuard validates
      // CountryGuard has allowed the route to render
      const wrapper = createRouterWrapper(TEST_PATHS.UK_POLICIES);

      // When
      const { result } = renderHook(() => useCurrentCountry(), { wrapper });

      // Then - Hook returns the validated country from URL
      expect(result.current).toBe(TEST_COUNTRIES.UK);
    });

    test('given nested route under country then extracts country correctly', () => {
      // Given - Deep nested path
      const wrapper = createRouterWrapper('/ca/reports/123/edit/settings');

      // When
      const { result } = renderHook(() => useCurrentCountry(), { wrapper });

      // Then - Extracts CA from first segment
      expect(result.current).toBe(TEST_COUNTRIES.CA);
    });
  });

  describe('Edge Cases', () => {
    test('given country with query params then returns country', () => {
      // Given
      const wrapper = createRouterWrapper('/uk/policies?filter=active&sort=date');

      // When
      const { result } = renderHook(() => useCurrentCountry(), { wrapper });

      // Then
      expect(result.current).toBe(TEST_COUNTRIES.UK);
    });

    test('given country with hash then returns country', () => {
      // Given
      const wrapper = createRouterWrapper('/us/reports#section-1');

      // When
      const { result } = renderHook(() => useCurrentCountry(), { wrapper });

      // Then
      expect(result.current).toBe(TEST_COUNTRIES.US);
    });

    test('given country with trailing slash then returns country', () => {
      // Given
      const wrapper = createRouterWrapper('/ca/policies/');

      // When
      const { result } = renderHook(() => useCurrentCountry(), { wrapper });

      // Then
      expect(result.current).toBe(TEST_COUNTRIES.CA);
    });
  });
});

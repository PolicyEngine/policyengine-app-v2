import { renderHook } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, test } from 'vitest';
import { AppProvider, AppMode } from '@/contexts/AppContext';
import { useWebsitePath } from '@/hooks/useWebsitePath';

/**
 * Test constants
 */
const TEST_COUNTRIES = {
  US: 'us',
  UK: 'uk',
} as const;

const WEBSITE_URL = 'https://policyengine.org';

/**
 * Helper to create a wrapper with both AppContext and Router
 */
function createWrapper(appMode: AppMode, countryId: string) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <AppProvider mode={appMode}>
        <MemoryRouter initialEntries={[`/${countryId}`]}>
          <Routes>
            <Route path="/:countryId/*" element={children} />
            <Route path="/:countryId" element={children} />
          </Routes>
        </MemoryRouter>
      </AppProvider>
    );
  };
}

describe('useWebsitePath', () => {
  describe('getWebsitePath', () => {
    describe('website app mode (same-app navigation)', () => {
      test('given website mode and US country then returns relative path', () => {
        // Given
        const wrapper = createWrapper('website', TEST_COUNTRIES.US);

        // When
        const { result } = renderHook(() => useWebsitePath(), { wrapper });

        // Then
        expect(result.current.getWebsitePath('/research')).toBe('/us/research');
      });

      test('given website mode and UK country then returns relative path', () => {
        // Given
        const wrapper = createWrapper('website', TEST_COUNTRIES.UK);

        // When
        const { result } = renderHook(() => useWebsitePath(), { wrapper });

        // Then
        expect(result.current.getWebsitePath('/research')).toBe('/uk/research');
      });

      test('given website mode then returns relative path for team page', () => {
        // Given
        const wrapper = createWrapper('website', TEST_COUNTRIES.US);

        // When
        const { result } = renderHook(() => useWebsitePath(), { wrapper });

        // Then
        expect(result.current.getWebsitePath('/team')).toBe('/us/team');
      });

      test('given website mode then returns relative path for donate page', () => {
        // Given
        const wrapper = createWrapper('website', TEST_COUNTRIES.UK);

        // When
        const { result } = renderHook(() => useWebsitePath(), { wrapper });

        // Then
        expect(result.current.getWebsitePath('/donate')).toBe('/uk/donate');
      });
    });

    describe('calculator app mode (cross-app navigation)', () => {
      test('given calculator mode and US country then returns absolute URL', () => {
        // Given
        const wrapper = createWrapper('calculator', TEST_COUNTRIES.US);

        // When
        const { result } = renderHook(() => useWebsitePath(), { wrapper });

        // Then
        expect(result.current.getWebsitePath('/research')).toBe(
          `${WEBSITE_URL}/us/research`
        );
      });

      test('given calculator mode and UK country then returns absolute URL', () => {
        // Given
        const wrapper = createWrapper('calculator', TEST_COUNTRIES.UK);

        // When
        const { result } = renderHook(() => useWebsitePath(), { wrapper });

        // Then
        expect(result.current.getWebsitePath('/research')).toBe(
          `${WEBSITE_URL}/uk/research`
        );
      });

      test('given calculator mode then returns absolute URL for team page', () => {
        // Given
        const wrapper = createWrapper('calculator', TEST_COUNTRIES.US);

        // When
        const { result } = renderHook(() => useWebsitePath(), { wrapper });

        // Then
        expect(result.current.getWebsitePath('/team')).toBe(`${WEBSITE_URL}/us/team`);
      });

      test('given calculator mode then returns absolute URL for supporters page', () => {
        // Given
        const wrapper = createWrapper('calculator', TEST_COUNTRIES.UK);

        // When
        const { result } = renderHook(() => useWebsitePath(), { wrapper });

        // Then
        expect(result.current.getWebsitePath('/supporters')).toBe(
          `${WEBSITE_URL}/uk/supporters`
        );
      });
    });
  });

  describe('getHomeHref', () => {
    describe('website app mode', () => {
      test('given website mode and US country then returns relative home path', () => {
        // Given
        const wrapper = createWrapper('website', TEST_COUNTRIES.US);

        // When
        const { result } = renderHook(() => useWebsitePath(), { wrapper });

        // Then
        expect(result.current.getHomeHref()).toBe('/us');
      });

      test('given website mode and UK country then returns relative home path', () => {
        // Given
        const wrapper = createWrapper('website', TEST_COUNTRIES.UK);

        // When
        const { result } = renderHook(() => useWebsitePath(), { wrapper });

        // Then
        expect(result.current.getHomeHref()).toBe('/uk');
      });
    });

    describe('calculator app mode', () => {
      test('given calculator mode and US country then returns absolute home URL', () => {
        // Given
        const wrapper = createWrapper('calculator', TEST_COUNTRIES.US);

        // When
        const { result } = renderHook(() => useWebsitePath(), { wrapper });

        // Then
        expect(result.current.getHomeHref()).toBe(`${WEBSITE_URL}/us`);
      });

      test('given calculator mode and UK country then returns absolute home URL', () => {
        // Given
        const wrapper = createWrapper('calculator', TEST_COUNTRIES.UK);

        // When
        const { result } = renderHook(() => useWebsitePath(), { wrapper });

        // Then
        expect(result.current.getHomeHref()).toBe(`${WEBSITE_URL}/uk`);
      });
    });
  });

  describe('returned values', () => {
    test('given hook called then returns appMode', () => {
      // Given
      const wrapper = createWrapper('website', TEST_COUNTRIES.US);

      // When
      const { result } = renderHook(() => useWebsitePath(), { wrapper });

      // Then
      expect(result.current.appMode).toBe('website');
    });

    test('given hook called then returns countryId', () => {
      // Given
      const wrapper = createWrapper('calculator', TEST_COUNTRIES.UK);

      // When
      const { result } = renderHook(() => useWebsitePath(), { wrapper });

      // Then
      expect(result.current.countryId).toBe('uk');
    });
  });

  describe('stability', () => {
    test('given hook rerenders then functions remain stable', () => {
      // Given
      const wrapper = createWrapper('website', TEST_COUNTRIES.US);
      const { result, rerender } = renderHook(() => useWebsitePath(), { wrapper });
      const initialGetWebsitePath = result.current.getWebsitePath;
      const initialGetHomeHref = result.current.getHomeHref;

      // When
      rerender();

      // Then - Functions should produce same results
      expect(result.current.getWebsitePath('/research')).toBe(
        initialGetWebsitePath('/research')
      );
      expect(result.current.getHomeHref()).toBe(initialGetHomeHref());
    });
  });
});

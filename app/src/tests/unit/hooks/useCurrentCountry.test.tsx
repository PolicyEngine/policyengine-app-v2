import { renderHook } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { CountryProvider } from '@/contexts/CountryContext';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import type { CountryId } from '@/libs/countries';
import { TEST_COUNTRIES } from '@/tests/fixtures/hooks/useCurrentCountryMocks';
import { REMOVED_COUNTRY_IDS } from '@/tests/fixtures/libs/countriesMocks';

function createWrapper(countryId: CountryId) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <CountryProvider value={countryId}>{children}</CountryProvider>;
  };
}

describe('useCurrentCountry', () => {
  describe('Reading from CountryContext', () => {
    test('given UK in context then returns uk', () => {
      const wrapper = createWrapper(TEST_COUNTRIES.UK as CountryId);
      const { result } = renderHook(() => useCurrentCountry(), { wrapper });
      expect(result.current).toBe(TEST_COUNTRIES.UK);
    });

    test('given US in context then returns us', () => {
      const wrapper = createWrapper(TEST_COUNTRIES.US as CountryId);
      const { result } = renderHook(() => useCurrentCountry(), { wrapper });
      expect(result.current).toBe(TEST_COUNTRIES.US);
    });
  });

  describe('Error Handling', () => {
    test('given no CountryProvider then throws error', () => {
      expect(() => {
        renderHook(() => useCurrentCountry());
      }).toThrow('useCurrentCountry must be used within a CountryProvider');
    });

    test.each(REMOVED_COUNTRY_IDS)(
      'given %s, a country the app no longer offers, in context then throws error',
      (removedCountryId) => {
        expect(() => {
          renderHook(() => useCurrentCountry(), {
            wrapper: createWrapper(removedCountryId as string as CountryId),
          });
        }).toThrow('useCurrentCountry must be used within a CountryProvider');
      }
    );

    test('given invalid country in context then throws error', () => {
      expect(() => {
        renderHook(() => useCurrentCountry(), {
          wrapper: ({ children }) => (
            <CountryProvider value={'xyz' as any}>{children}</CountryProvider>
          ),
        });
      }).toThrow('useCurrentCountry must be used within a CountryProvider');
    });

    test('given invalid country then error message includes country ID', () => {
      expect(() => {
        renderHook(() => useCurrentCountry(), {
          wrapper: ({ children }) => (
            <CountryProvider value={'xyz' as any}>{children}</CountryProvider>
          ),
        });
      }).toThrow('Got countryId: xyz');
    });
  });

  describe('Type Safety', () => {
    test('given valid country then returns typed country ID', () => {
      const wrapper = createWrapper(TEST_COUNTRIES.UK as CountryId);
      const { result } = renderHook(() => useCurrentCountry(), { wrapper });
      const country: 'us' | 'uk' | 'ca' | 'ng' | 'il' = result.current;
      expect(country).toBe(TEST_COUNTRIES.UK);
    });
  });
});

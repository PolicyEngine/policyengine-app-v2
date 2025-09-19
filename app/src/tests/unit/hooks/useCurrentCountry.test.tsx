import { renderHook } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, test, vi } from 'vitest';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';

// Wrapper component that provides router context
function createWrapper(initialPath: string) {
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
  test('given valid country in URL then returns country ID', () => {
    // Given
    const wrapper = createWrapper('/uk/policies');

    // When
    const { result } = renderHook(() => useCurrentCountry(), { wrapper });

    // Then
    expect(result.current).toBe('uk');
  });

  test('given US country in URL then returns us', () => {
    // Given
    const wrapper = createWrapper('/us/household');

    // When
    const { result } = renderHook(() => useCurrentCountry(), { wrapper });

    // Then
    expect(result.current).toBe('us');
  });

  test('given Canada country in URL then returns ca', () => {
    // Given
    const wrapper = createWrapper('/ca/about');

    // When
    const { result } = renderHook(() => useCurrentCountry(), { wrapper });

    // Then
    expect(result.current).toBe('ca');
  });

  test('given invalid country in URL then returns us as fallback', () => {
    // Given
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const wrapper = createWrapper('/invalid-country/policies');

    // When
    const { result } = renderHook(() => useCurrentCountry(), { wrapper });

    // Then
    expect(result.current).toBe('us');
    expect(consoleSpy).toHaveBeenCalledWith(
      'Invalid or missing country ID in URL: invalid-country'
    );

    consoleSpy.mockRestore();
  });

  test('given no country in URL then returns us as fallback', () => {
    // Given
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const wrapper = createWrapper('/');

    // When
    const { result } = renderHook(() => useCurrentCountry(), { wrapper });

    // Then
    expect(result.current).toBe('us');
    expect(consoleSpy).toHaveBeenCalledWith('Invalid or missing country ID in URL: undefined');

    consoleSpy.mockRestore();
  });
});

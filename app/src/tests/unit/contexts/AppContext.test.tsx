import React from 'react';
import { renderHook } from '@test-utils';
import { describe, expect, test } from 'vitest';
import { AppProvider, useAppMode } from '@/contexts/AppContext';

describe('AppContext', () => {
  describe('AppProvider', () => {
    test('given website mode then provides website app mode', () => {
      // Given
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AppProvider mode="website">{children}</AppProvider>
      );

      // When
      const { result } = renderHook(() => useAppMode(), { wrapper });

      // Then
      expect(result.current).toBe('website');
    });

    test('given calculator mode then provides calculator app mode', () => {
      // Given
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AppProvider mode="calculator">{children}</AppProvider>
      );

      // When
      const { result } = renderHook(() => useAppMode(), { wrapper });

      // Then
      expect(result.current).toBe('calculator');
    });

    test('given provider rerenders then mode remains stable', () => {
      // Given
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AppProvider mode="website">{children}</AppProvider>
      );
      const { result, rerender } = renderHook(() => useAppMode(), { wrapper });
      const firstMode = result.current;

      // When
      rerender();

      // Then
      expect(result.current).toBe(firstMode);
      expect(result.current).toBe('website');
    });
  });

  describe('useAppMode', () => {
    test('given hook used within provider then returns app mode', () => {
      // Given
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AppProvider mode="website">{children}</AppProvider>
      );

      // When
      const { result } = renderHook(() => useAppMode(), { wrapper });

      // Then
      expect(result.current).toBeDefined();
      expect(['website', 'calculator']).toContain(result.current);
    });

    test('given hook used outside provider then throws error', () => {
      // Given - No wrapper (outside provider)
      const { result } = renderHook(() => {
        try {
          return useAppMode();
        } catch (error) {
          return error;
        }
      });

      // Then
      expect(result.current).toBeInstanceOf(Error);
      expect((result.current as Error).message).toContain(
        'useAppMode must be used within an AppProvider'
      );
    });

    test('given multiple hook calls in same provider then return same mode', () => {
      // Given
      const useMultipleAppMode = () => {
        const firstMode = useAppMode();
        const secondMode = useAppMode();
        return { firstMode, secondMode };
      };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AppProvider mode="calculator">{children}</AppProvider>
      );

      // When
      const { result } = renderHook(() => useMultipleAppMode(), { wrapper });

      // Then
      expect(result.current.firstMode).toBe(result.current.secondMode);
      expect(result.current.firstMode).toBe('calculator');
    });
  });
});

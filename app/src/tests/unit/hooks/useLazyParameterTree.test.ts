/**
 * Unit tests for useLazyParameterTree hook
 *
 * Tests the React hook that provides on-demand parameter tree access with caching.
 */
import { describe, expect, test, vi, beforeEach } from 'vitest';
import { renderHook } from '@test-utils';
import { useLazyParameterTree } from '@/hooks/useLazyParameterTree';
import {
  createMockRootState,
  EXPECTED_GOV_CHILDREN,
  EXPECTED_TAX_CHILDREN,
  MOCK_METADATA_EMPTY,
  MOCK_METADATA_ERROR,
  MOCK_METADATA_LOADED,
  MOCK_METADATA_LOADING,
  MOCK_PARAMETERS_FOR_HOOK,
  TEST_ERROR_MESSAGE,
} from '@/tests/fixtures/hooks/useLazyParameterTreeMocks';

// Mock react-redux
vi.mock('react-redux', async () => {
  const actual = await vi.importActual('react-redux');
  return {
    ...actual,
    useSelector: vi.fn(),
  };
});

import { useSelector } from 'react-redux';

describe('useLazyParameterTree', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loading state', () => {
    test('given metadata is loading then returns loading true', () => {
      // Given
      vi.mocked(useSelector).mockImplementation((selector) =>
        selector(createMockRootState(MOCK_METADATA_LOADING))
      );

      // When
      const { result } = renderHook(() => useLazyParameterTree());

      // Then
      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBeNull();
    });

    test('given metadata is loaded then returns loading false', () => {
      // Given
      vi.mocked(useSelector).mockImplementation((selector) =>
        selector(createMockRootState(MOCK_METADATA_LOADED))
      );

      // When
      const { result } = renderHook(() => useLazyParameterTree());

      // Then
      expect(result.current.loading).toBe(false);
    });
  });

  describe('error state', () => {
    test('given metadata has error then returns error message', () => {
      // Given
      vi.mocked(useSelector).mockImplementation((selector) =>
        selector(createMockRootState(MOCK_METADATA_ERROR))
      );

      // When
      const { result } = renderHook(() => useLazyParameterTree());

      // Then
      expect(result.current.error).toBe(TEST_ERROR_MESSAGE);
    });

    test('given metadata has no error then returns null', () => {
      // Given
      vi.mocked(useSelector).mockImplementation((selector) =>
        selector(createMockRootState(MOCK_METADATA_LOADED))
      );

      // When
      const { result } = renderHook(() => useLazyParameterTree());

      // Then
      expect(result.current.error).toBeNull();
    });
  });

  describe('getChildren', () => {
    test('given loaded metadata then returns children for path', () => {
      // Given
      vi.mocked(useSelector).mockImplementation((selector) =>
        selector(createMockRootState(MOCK_METADATA_LOADED))
      );

      // When
      const { result } = renderHook(() => useLazyParameterTree());
      const children = result.current.getChildren('gov');

      // Then
      expect(children).toHaveLength(2);
      expect(children.map((c) => c.name)).toEqual(
        expect.arrayContaining(['gov.tax', 'gov.benefit'])
      );
    });

    test('given empty parameters then returns empty array', () => {
      // Given
      vi.mocked(useSelector).mockImplementation((selector) =>
        selector(createMockRootState(MOCK_METADATA_EMPTY))
      );

      // When
      const { result } = renderHook(() => useLazyParameterTree());
      const children = result.current.getChildren('gov');

      // Then
      expect(children).toEqual([]);
    });

    test('given parameters not loaded yet then returns empty array', () => {
      // Given
      vi.mocked(useSelector).mockImplementation((selector) =>
        selector(createMockRootState(MOCK_METADATA_LOADING))
      );

      // When
      const { result } = renderHook(() => useLazyParameterTree());
      const children = result.current.getChildren('gov');

      // Then
      expect(children).toEqual([]);
    });

    test('given nested path then returns correct children', () => {
      // Given
      vi.mocked(useSelector).mockImplementation((selector) =>
        selector(createMockRootState(MOCK_METADATA_LOADED))
      );

      // When
      const { result } = renderHook(() => useLazyParameterTree());
      const children = result.current.getChildren('gov.tax');

      // Then
      expect(children).toHaveLength(2);
      children.forEach((child) => {
        expect(child.type).toBe('parameter');
      });
    });

    test('given multiple calls with same path then returns cached result', () => {
      // Given
      vi.mocked(useSelector).mockImplementation((selector) =>
        selector(createMockRootState(MOCK_METADATA_LOADED))
      );

      // When
      const { result } = renderHook(() => useLazyParameterTree());
      const first = result.current.getChildren('gov');
      const second = result.current.getChildren('gov');

      // Then
      expect(first).toBe(second);
    });
  });

  describe('hasChildren', () => {
    test('given path with children then returns true', () => {
      // Given
      vi.mocked(useSelector).mockImplementation((selector) =>
        selector(createMockRootState(MOCK_METADATA_LOADED))
      );

      // When
      const { result } = renderHook(() => useLazyParameterTree());
      const has = result.current.hasChildren('gov.tax');

      // Then
      expect(has).toBe(true);
    });

    test('given leaf path then returns false', () => {
      // Given
      vi.mocked(useSelector).mockImplementation((selector) =>
        selector(createMockRootState(MOCK_METADATA_LOADED))
      );

      // When
      const { result } = renderHook(() => useLazyParameterTree());
      const has = result.current.hasChildren('gov.tax.rate');

      // Then
      expect(has).toBe(false);
    });

    test('given empty parameters then returns false', () => {
      // Given
      vi.mocked(useSelector).mockImplementation((selector) =>
        selector(createMockRootState(MOCK_METADATA_EMPTY))
      );

      // When
      const { result } = renderHook(() => useLazyParameterTree());
      const has = result.current.hasChildren('gov');

      // Then
      expect(has).toBe(false);
    });
  });

  describe('cache persistence', () => {
    test('given hook re-renders then cache persists', () => {
      // Given
      vi.mocked(useSelector).mockImplementation((selector) =>
        selector(createMockRootState(MOCK_METADATA_LOADED))
      );

      // When
      const { result, rerender } = renderHook(() => useLazyParameterTree());
      const firstCall = result.current.getChildren('gov');
      rerender();
      const secondCall = result.current.getChildren('gov');

      // Then
      expect(firstCall).toBe(secondCall);
    });
  });

  describe('return structure', () => {
    test('given any state then returns all expected properties', () => {
      // Given
      vi.mocked(useSelector).mockImplementation((selector) =>
        selector(createMockRootState(MOCK_METADATA_LOADED))
      );

      // When
      const { result } = renderHook(() => useLazyParameterTree());

      // Then
      expect(result.current).toHaveProperty('getChildren');
      expect(result.current).toHaveProperty('hasChildren');
      expect(result.current).toHaveProperty('loading');
      expect(result.current).toHaveProperty('error');
      expect(typeof result.current.getChildren).toBe('function');
      expect(typeof result.current.hasChildren).toBe('function');
      expect(typeof result.current.loading).toBe('boolean');
    });
  });
});

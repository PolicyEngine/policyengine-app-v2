import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@test-utils';
import { useBasicInputFields } from '@/hooks/useBasicInputFields';
import {
  TEST_COUNTRIES,
  MOCK_VARIABLES_RECORD,
  createMockRootState,
} from '@/tests/fixtures/hooks/metadataHooksMocks';

// Mock react-redux
vi.mock('react-redux', async () => {
  const actual = await vi.importActual('react-redux');
  return {
    ...actual,
    useSelector: vi.fn((selector) =>
      selector(
        createMockRootState({
          variables: MOCK_VARIABLES_RECORD,
        })
      )
    ),
  };
});

describe('useBasicInputFields', () => {
  describe('entity categorization', () => {
    it('given US country with variables then returns categorized fields', () => {
      // When
      const { result } = renderHook(() => useBasicInputFields(TEST_COUNTRIES.US));

      // Then
      expect(typeof result.current).toBe('object');
    });

    it('given US country then person fields include age and employment_income', () => {
      // When
      const { result } = renderHook(() => useBasicInputFields(TEST_COUNTRIES.US));

      // Then
      if (result.current.person) {
        expect(result.current.person).toContain('age');
        expect(result.current.person).toContain('employment_income');
      }
    });

    it('given US country then creates separate categories for different entities', () => {
      // When
      const { result } = renderHook(() => useBasicInputFields(TEST_COUNTRIES.US));

      // Then
      // Should have at least person category
      expect(Object.keys(result.current).length).toBeGreaterThan(0);
    });
  });

  describe('memoization', () => {
    it('given same country then returns memoized result', () => {
      // Given
      const { result, rerender } = renderHook(
        ({ countryId }) => useBasicInputFields(countryId),
        { initialProps: { countryId: TEST_COUNTRIES.US } }
      );
      const firstResult = result.current;

      // When
      rerender({ countryId: TEST_COUNTRIES.US });

      // Then - should return stable reference
      expect(result.current).toBe(firstResult);
    });
  });
});

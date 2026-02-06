import { renderHook } from '@test-utils';
import { describe, expect, it } from 'vitest';
import {
  useBasicInputs,
  useCurrentLawId,
  useEntities,
  useModelledPolicies,
  useStaticMetadata,
  useTimePeriods,
} from '@/hooks/useStaticMetadata';
import { TEST_COUNTRIES } from '@/tests/fixtures/hooks/metadataHooksMocks';

describe('useStaticMetadata', () => {
  describe('useStaticMetadata (composite hook)', () => {
    it('given US country then returns complete static metadata', () => {
      // When
      const { result } = renderHook(() => useStaticMetadata(TEST_COUNTRIES.US));

      // Then
      expect(result.current).toHaveProperty('entities');
      expect(result.current).toHaveProperty('basicInputs');
      expect(result.current).toHaveProperty('timePeriods');
      expect(result.current).toHaveProperty('modelledPolicies');
      expect(result.current).toHaveProperty('currentLawId');
      // Note: regions are now fetched from V2 API via useRegions() hook
    });

    it('given US country then entities contains person entity', () => {
      // When
      const { result } = renderHook(() => useStaticMetadata(TEST_COUNTRIES.US));

      // Then
      expect(result.current.entities).toHaveProperty('person');
      expect(result.current.entities.person).toHaveProperty('label');
    });

    it('given US country then basicInputs includes age and employment_income', () => {
      // When
      const { result } = renderHook(() => useStaticMetadata(TEST_COUNTRIES.US));

      // Then
      expect(result.current.basicInputs).toContain('age');
      expect(result.current.basicInputs).toContain('employment_income');
    });

    it('given UK country then returns UK-specific entities', () => {
      // When
      const { result } = renderHook(() => useStaticMetadata(TEST_COUNTRIES.UK));

      // Then
      expect(result.current.entities).toHaveProperty('person');
      expect(result.current.entities).toHaveProperty('benunit');
      expect(result.current.entities).not.toHaveProperty('tax_unit');
    });
  });

  describe('useEntities', () => {
    it('given US country then returns US entity definitions', () => {
      // When
      const { result } = renderHook(() => useEntities(TEST_COUNTRIES.US));

      // Then
      expect(result.current).toHaveProperty('person');
      expect(result.current).toHaveProperty('tax_unit');
      expect(result.current).toHaveProperty('household');
    });

    it('given UK country then returns UK entity definitions', () => {
      // When
      const { result } = renderHook(() => useEntities(TEST_COUNTRIES.UK));

      // Then
      expect(result.current).toHaveProperty('person');
      expect(result.current).toHaveProperty('benunit');
    });

    it('given same country then returns memoized result', () => {
      // Given
      const { result, rerender } = renderHook(({ countryId }) => useEntities(countryId), {
        initialProps: { countryId: TEST_COUNTRIES.US },
      });
      const firstResult = result.current;

      // When
      rerender({ countryId: TEST_COUNTRIES.US });

      // Then
      expect(result.current).toBe(firstResult);
    });
  });

  describe('useBasicInputs', () => {
    it('given US country then returns US basic inputs', () => {
      // When
      const { result } = renderHook(() => useBasicInputs(TEST_COUNTRIES.US));

      // Then
      expect(result.current).toContain('age');
      expect(result.current).toContain('employment_income');
      expect(result.current).toContain('state_name');
    });

    it('given UK country then returns UK basic inputs', () => {
      // When
      const { result } = renderHook(() => useBasicInputs(TEST_COUNTRIES.UK));

      // Then
      expect(result.current).toContain('age');
      expect(result.current).toContain('employment_income');
      expect(result.current).toContain('region');
    });

    it('given unknown country then returns empty array', () => {
      // When
      const { result } = renderHook(() => useBasicInputs('unknown'));

      // Then
      expect(result.current).toEqual([]);
    });
  });

  describe('useTimePeriods', () => {
    it('given US country then returns array of time period options', () => {
      // When
      const { result } = renderHook(() => useTimePeriods(TEST_COUNTRIES.US));

      // Then
      expect(Array.isArray(result.current)).toBe(true);
      expect(result.current.length).toBeGreaterThan(0);
    });

    it('given US country then time periods have name and label', () => {
      // When
      const { result } = renderHook(() => useTimePeriods(TEST_COUNTRIES.US));

      // Then
      result.current.forEach((period) => {
        expect(period).toHaveProperty('name');
        expect(period).toHaveProperty('label');
      });
    });
  });

  describe('useModelledPolicies', () => {
    it('given US country then returns modelled policies object', () => {
      // When
      const { result } = renderHook(() => useModelledPolicies(TEST_COUNTRIES.US));

      // Then
      expect(typeof result.current).toBe('object');
    });
  });

  describe('useCurrentLawId', () => {
    // In V2 API, current law is represented by null (no policy ID)
    it('given US country then returns null', () => {
      // When
      const { result } = renderHook(() => useCurrentLawId(TEST_COUNTRIES.US));

      // Then
      expect(result.current).toBeNull();
    });

    it('given UK country then returns null', () => {
      // When
      const { result } = renderHook(() => useCurrentLawId(TEST_COUNTRIES.UK));

      // Then
      expect(result.current).toBeNull();
    });
  });
});

import { renderHook } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { useV3Variables, useV3VariablesInBackground } from '@/hooks/useV3Variables';
import { clearMetadata } from '@/reducers/metadataReducer';
import { store } from '@/store';
import { stubPublicApiFetch } from '@/tests/fixtures/api/publicApi/publicApiFetchStub';
import { seedDeductionMetadata } from '@/tests/fixtures/components/flagship/draftEditorFixtures';
import { v3Wrapper } from '@/tests/fixtures/hooks/v3MetadataWrapper';

describe('useV3Variables on the v1 routes (before the switch)', () => {
  beforeEach(() => {
    store.dispatch(clearMetadata());
    vi.unstubAllGlobals();
  });

  test('given the whole metadata loaded then the variables are ready, with no request', () => {
    // Given
    const fetchStub = stubPublicApiFetch();
    seedDeductionMetadata();

    // When
    const { result } = renderHook(() => useV3Variables(), { wrapper: v3Wrapper() });

    // Then
    expect(result.current).toMatchObject({ status: 'ready', waiting: false });
    expect(fetchStub).not.toHaveBeenCalled();
  });

  test('given the whole metadata still loading then nothing waits on the v2 routes', () => {
    // Given
    stubPublicApiFetch();

    // When
    const { result } = renderHook(() => useV3Variables(), { wrapper: v3Wrapper() });

    // Then
    expect(result.current.waiting).toBe(false);
  });

  test('given a page that rendered then nothing loads in the background', () => {
    // Given
    const fetchStub = stubPublicApiFetch();
    seedDeductionMetadata();

    // When
    renderHook(() => useV3VariablesInBackground(), { wrapper: v3Wrapper() });

    // Then
    expect(fetchStub).not.toHaveBeenCalled();
  });
});

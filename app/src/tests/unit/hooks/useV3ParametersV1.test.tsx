import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { useEnsureV3Parameters, useLoadV3Parameters } from '@/hooks/useV3Parameters';
import { clearMetadata } from '@/reducers/metadataReducer';
import { store } from '@/store';
import { stubPublicApiFetch } from '@/tests/fixtures/api/publicApi/publicApiFetchStub';
import { seedDeductionMetadata } from '@/tests/fixtures/components/flagship/draftEditorFixtures';
import { v3Wrapper } from '@/tests/fixtures/hooks/v3MetadataWrapper';

describe('useEnsureV3Parameters on the v1 routes (before the switch)', () => {
  beforeEach(() => {
    store.dispatch(clearMetadata());
    vi.unstubAllGlobals();
  });

  test('given the whole metadata loaded then every parameter is ready, with no request', () => {
    // Given
    const fetchStub = stubPublicApiFetch();
    seedDeductionMetadata();

    // When
    const { result } = renderHook(() => useEnsureV3Parameters(['gov.irs.anything']), {
      wrapper: v3Wrapper(),
    });

    // Then
    expect(result.current.status).toBe('ready');
    expect(fetchStub).not.toHaveBeenCalled();
  });

  test('given the load function then it resolves without a request', async () => {
    const fetchStub = stubPublicApiFetch();
    seedDeductionMetadata();
    const { result } = renderHook(() => useLoadV3Parameters(), { wrapper: v3Wrapper() });

    await result.current(['gov.irs.anything']);

    expect(fetchStub).not.toHaveBeenCalled();
  });
});

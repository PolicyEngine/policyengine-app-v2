import { configureStore } from '@reduxjs/toolkit';
import { describe, expect, test, vi } from 'vitest';
import { fetchMetadata } from '@/api/metadata';
import reducer, { fetchMetadataThunk, setCurrentCountry } from '@/reducers/metadataReducer';
import { createMockApiPayload } from '@/tests/fixtures/reducers/metadataReducerMocks';
import { CANONICAL_SPM_METADATA } from '@/tests/fixtures/spm/spmMocks';
import type { MetadataApiPayload } from '@/types/metadata';

vi.mock('@/api/metadata');

function pending(country: string, id = `${country}-request`) {
  return fetchMetadataThunk.pending(id, country);
}
function fulfilled(country: string, id = `${country}-request`) {
  return fetchMetadataThunk.fulfilled(
    {
      data: createMockApiPayload({ spm: country === 'us' ? CANONICAL_SPM_METADATA : undefined }),
      country,
    },
    id,
    country
  );
}

describe('SPM metadata availability', () => {
  test('given a canonical US response then availability is kept and cleared on country change', () => {
    const state = reducer(reducer(undefined, pending('us')), fulfilled('us'));
    expect(state.spm).toEqual(CANONICAL_SPM_METADATA);
    const changed = reducer(state, setCurrentCountry('uk'));
    expect(changed.spm).toBeUndefined();
    expect(changed.version).toBeNull();
  });

  test('given a country change during loading then the old response cannot supply capabilities', () => {
    const state = reducer(reducer(undefined, pending('us')), setCurrentCountry('uk'));
    expect(reducer(state, fulfilled('us'))).toEqual(state);
  });

  test('given a later request for the same country then old success and failure are ignored', () => {
    let state = reducer(undefined, pending('us', 'old-request'));
    state = reducer(state, pending('us', 'new-request'));
    expect(reducer(state, fulfilled('us', 'old-request'))).toEqual(state);
    expect(
      reducer(state, fetchMetadataThunk.rejected(new Error('Old failure'), 'old-request', 'us'))
    ).toEqual(state);
    expect(reducer(state, fulfilled('us', 'new-request')).spm).toEqual(CANONICAL_SPM_METADATA);
  });

  test('given a country switch with an in-flight fetch then the new fetch starts and its metadata wins', async () => {
    let resolveUS!: (data: MetadataApiPayload) => void;
    let resolveUK!: (data: MetadataApiPayload) => void;
    vi.mocked(fetchMetadata).mockImplementation(
      (country) =>
        new Promise((resolve) => {
          if (country === 'us') {
            resolveUS = resolve;
          } else {
            resolveUK = resolve;
          }
        })
    );
    const store = configureStore({ reducer: { metadata: reducer } });
    const usRequest = store.dispatch(fetchMetadataThunk('us'));
    const duplicate = await store.dispatch(fetchMetadataThunk('us'));
    expect(duplicate.meta.requestStatus).toBe('rejected');
    const ukRequest = store.dispatch(fetchMetadataThunk('uk'));
    expect(store.getState().metadata.currentCountry).toBe('uk');
    resolveUK(createMockApiPayload());
    await ukRequest;
    resolveUS(createMockApiPayload({ spm: CANONICAL_SPM_METADATA }));
    await usRequest;
    expect(store.getState().metadata.currentCountry).toBe('uk');
    expect(store.getState().metadata.loading).toBe(false);
    expect(store.getState().metadata.spm).toBeUndefined();
  });

  test('given a successful HTTP response without successful model metadata then legacy remains unavailable', async () => {
    vi.mocked(fetchMetadata).mockResolvedValue({
      ...createMockApiPayload(),
      status: 'error',
      message: 'Model unavailable',
    });
    const store = configureStore({ reducer: { metadata: reducer } });
    await store.dispatch(fetchMetadataThunk('us'));
    expect(store.getState().metadata.error).toBe('Model unavailable');
    expect(store.getState().metadata.version).toBeNull();
  });
});

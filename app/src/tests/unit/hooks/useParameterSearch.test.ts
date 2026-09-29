import { act, renderHook } from '@test-utils';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { useParameterSearch } from '@/hooks/useParameterSearch';
import {
  buildParameterSearchEntries,
  createParameterSearchIndex,
  DEFAULT_SEARCH_FILTERS,
} from '@/libs/parameterSearch';
import { MockSearchWorker } from '@/tests/fixtures/hooks/parameterSearchWorker';
import { buildSearchQualityParameterCollection } from '@/tests/fixtures/libs/parameterSearchMocks';

const index = createParameterSearchIndex(
  buildParameterSearchEntries(buildSearchQualityParameterCollection())
);
beforeEach(() => {
  vi.useFakeTimers();
  MockSearchWorker.instances = [];
  vi.stubGlobal('Worker', MockSearchWorker);
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

test('given rapid typing then searches only the latest query and ignores obsolete replies', () => {
  const { result, rerender, unmount } = renderHook(
    ({ query }) => useParameterSearch(index, query, DEFAULT_SEARCH_FILTERS, 20, true),
    { initialProps: { query: 'child' } }
  );
  const worker = MockSearchWorker.instances[0];
  act(() => vi.advanceTimersByTime(80));
  const oldId = worker.postMessage.mock.calls.at(-1)![0].id;
  rerender({ query: 'child tax' });
  rerender({ query: 'child tax credit' });
  act(() => vi.advanceTimersByTime(80));
  const latest = worker.postMessage.mock.calls.at(-1)![0];
  expect(worker.postMessage).toHaveBeenCalledTimes(3); // init + two settled searches
  expect(latest.query).toBe('child tax credit');
  act(() => worker.reply({ id: oldId, entries: [index.entries[0]] }));
  expect(result.current.pending).toBe(true);
  expect(result.current.entries).toEqual([]);
  act(() => worker.reply({ id: latest.id, entries: [index.entries[0]] }));
  expect(result.current.pending).toBe(false);
  expect(result.current.entries).toEqual([index.entries[0]]);
  rerender({ query: '' });
  expect(result.current.entries).toEqual([]);
  unmount();
  expect(worker.terminate).toHaveBeenCalled();
});

test('given a failed worker then search falls back to the existing matcher', () => {
  const { result } = renderHook(() =>
    useParameterSearch(index, 'child', DEFAULT_SEARCH_FILTERS, 20, true)
  );
  act(() => MockSearchWorker.instances[0].onerror?.());
  expect(result.current.pending).toBe(false);
  expect(result.current.entries.length).toBeGreaterThan(0);
});

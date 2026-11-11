import { useEffect, useMemo, useRef, useState } from 'react';
import {
  matchesFilters,
  searchParametersWidening,
  type ParameterSearchEntry,
  type ParameterSearchFilters,
  type ParameterSearchIndex,
} from '@/libs/parameterSearch';
import type { SearchWorkerRequest, SearchWorkerResponse } from '@/libs/parameterSearch.worker';
import { snapshotUsageCounts } from '@/libs/searchPriors';

/** Keep full-index fuzzy matching off the typing/painting thread. */
export function useParameterSearch(
  index: ParameterSearchIndex,
  query: string,
  filters: ParameterSearchFilters,
  limit: number,
  background: boolean
) {
  const [failed, setFailed] = useState(false);
  const asynchronous = background && typeof Worker !== 'undefined' && !failed;
  const worker = useRef<Worker | null>(null);
  const requestId = useRef(0);
  const lastPostedQuery = useRef<string | null>(null);
  const [result, setResult] = useState<{
    query: string;
    filters: ParameterSearchFilters;
    index: ParameterSearchIndex;
    entries: ParameterSearchEntry[];
    widenedFilters: ParameterSearchFilters | null;
  } | null>(null);

  useEffect(() => {
    if (!asynchronous) {
      return;
    }
    try {
      const instance = new Worker(new URL('../libs/parameterSearch.worker.ts', import.meta.url), {
        type: 'module',
      });
      worker.current = instance;
      instance.onerror = () => setFailed(true);
      instance.postMessage({
        type: 'init',
        entries: index.entries,
        clusters: index.clusters,
        aliases: index.aliases,
        stateNames: index.stateNames,
      } satisfies SearchWorkerRequest);
      return () => {
        instance.terminate();
        worker.current = null;
      };
    } catch {
      setFailed(true);
    }
  }, [index, asynchronous]);

  useEffect(() => {
    const id = ++requestId.current;
    if (!asynchronous || !worker.current) {
      return;
    }
    const instance = worker.current;
    instance.onmessage = ({ data }: MessageEvent<SearchWorkerResponse>) => {
      if (data.id === requestId.current) {
        setResult({
          query,
          filters,
          index,
          entries: data.entries,
          widenedFilters: data.widenedFilters ?? null,
        });
      }
    };
    // Coalesce rapid keystrokes instead of queueing expensive obsolete
    // queries; a filter change on the same query is one click, so it goes
    // straight away.
    const delay = query === lastPostedQuery.current ? 0 : 80;
    const timer = setTimeout(() => {
      lastPostedQuery.current = query;
      instance.postMessage({
        type: 'search',
        usageCounts: snapshotUsageCounts(),
        id,
        query,
        filters,
        limit,
      } satisfies SearchWorkerRequest);
    }, delay);
    return () => {
      clearTimeout(timer);
      instance.onmessage = null;
    };
  }, [index, query, filters, limit, asynchronous]);

  const synchronous = useMemo(
    () => (asynchronous ? null : searchParametersWidening(index, query, limit, filters)),
    [asynchronous, index, query, limit, filters]
  );
  const empty = query.trim().length < 2;
  // A filter change keeps the query, so the results already in hand can be
  // narrowed at once: the list answers the click while the full search —
  // which can surface entries the old top results did not hold — runs
  // behind it. These are real matches under the new filters, so they
  // stay pickable. When none of them survive, the old list stays up
  // (unpickable) until the reply rather than flashing empty.
  const narrowed =
    asynchronous &&
    result &&
    result.query === query &&
    result.index === index &&
    result.filters !== filters
      ? result.entries.filter((entry) => matchesFilters(entry, filters))
      : null;
  const provisional = narrowed && narrowed.length > 0 ? narrowed : null;
  const pending =
    !empty &&
    asynchronous &&
    (result?.query !== query || result?.filters !== filters || result?.index !== index);

  let entries: ParameterSearchEntry[];
  let widenedFilters: ParameterSearchFilters | null;
  if (empty) {
    entries = [];
    widenedFilters = null;
  } else if (!asynchronous) {
    entries = synchronous?.entries ?? [];
    widenedFilters = synchronous && synchronous.filters !== filters ? synchronous.filters : null;
  } else if (provisional) {
    entries = provisional;
    widenedFilters = null;
  } else {
    entries = result?.entries ?? [];
    widenedFilters = result?.widenedFilters ?? null;
  }

  return {
    entries,
    pending,
    /** Results on screen belong to an older query: shown, but not pickable. */
    stale: pending && provisional === null,
    /**
     * Set when nothing matched the filters and the entries come from a
     * wider search instead: the filters they do satisfy.
     */
    widenedFilters,
  };
}

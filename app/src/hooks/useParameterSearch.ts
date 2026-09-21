import { useEffect, useMemo, useRef, useState } from 'react';
import {
  searchParameters,
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
  const [result, setResult] = useState<{
    query: string;
    filters: ParameterSearchFilters;
    index: ParameterSearchIndex;
    entries: ParameterSearchEntry[];
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
        setResult({ query, filters, index, entries: data.entries });
      }
    };
    // Coalesce rapid keystrokes instead of queueing expensive obsolete queries.
    const timer = setTimeout(() => {
      instance.postMessage({
        type: 'search',
        usageCounts: snapshotUsageCounts(),
        id,
        query,
        filters,
        limit,
      } satisfies SearchWorkerRequest);
    }, 80);
    return () => {
      clearTimeout(timer);
      instance.onmessage = null;
    };
  }, [index, query, filters, limit, asynchronous]);

  const synchronousEntries = useMemo(
    () => (asynchronous ? [] : searchParameters(index, query, limit, filters)),
    [asynchronous, index, query, limit, filters]
  );
  const empty = query.trim().length < 2;
  return {
    entries: empty ? [] : asynchronous ? (result?.entries ?? []) : synchronousEntries,
    pending:
      !empty &&
      asynchronous &&
      (result?.query !== query || result?.filters !== filters || result?.index !== index),
  };
}

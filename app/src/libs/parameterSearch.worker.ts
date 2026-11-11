import {
  createParameterSearchIndex,
  searchParametersWidening,
  type ParameterSearchEntry,
  type ParameterSearchFilters,
  type ParameterSearchIndex,
} from './parameterSearch';
import { restoreUsageCounts } from './searchPriors';

export type SearchWorkerRequest =
  | {
      type: 'init';
      entries: ParameterSearchEntry[];
      clusters: string[][];
      aliases: Map<string, string>;
      stateNames: Map<string, string>;
    }
  | {
      type: 'search';
      usageCounts: Map<string, number>;
      id: number;
      query: string;
      filters: ParameterSearchFilters;
      limit: number;
    };
export interface SearchWorkerResponse {
  id: number;
  entries: ParameterSearchEntry[];
  /** Filters the entries satisfy, when wider than requested. */
  widenedFilters?: ParameterSearchFilters;
}

let index: ParameterSearchIndex;
self.onmessage = ({ data }: MessageEvent<SearchWorkerRequest>) => {
  if (data.type === 'init') {
    index = createParameterSearchIndex(data.entries, data.clusters, data.aliases, data.stateNames);
  } else {
    restoreUsageCounts(data.usageCounts);
    const result = searchParametersWidening(index, data.query, data.limit, data.filters);
    self.postMessage({
      id: data.id,
      entries: result.entries,
      widenedFilters: result.filters === data.filters ? undefined : result.filters,
    } satisfies SearchWorkerResponse);
  }
};

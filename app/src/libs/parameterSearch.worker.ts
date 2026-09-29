import {
  createParameterSearchIndex,
  searchParameters,
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
}

let index: ParameterSearchIndex;
self.onmessage = ({ data }: MessageEvent<SearchWorkerRequest>) => {
  if (data.type === 'init') {
    index = createParameterSearchIndex(data.entries, data.clusters, data.aliases);
  } else {
    restoreUsageCounts(data.usageCounts);
    self.postMessage({
      id: data.id,
      entries: searchParameters(index, data.query, data.limit, data.filters),
    } satisfies SearchWorkerResponse);
  }
};

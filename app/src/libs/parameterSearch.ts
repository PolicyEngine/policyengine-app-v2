import { createSelector } from '@reduxjs/toolkit';
import Fuse, { IFuseOptions } from 'fuse.js';
import { RootState } from '@/store';
import { ParameterMetadata, ParameterMetadataCollection } from '@/types/metadata/parameterMetadata';
import { formatLabelParts, getHierarchicalLabels } from '@/utils/parameterLabels';

/**
 * Universal parameter search for the flagship shell.
 *
 * The existing sidebar search matches substrings of bare leaf labels
 * ("amount", "threshold"), which is why parameters are hard to find: a
 * query like "child tax credit amount" matches nothing. This index
 * searches the full hierarchical breadcrumb (built from the same labels
 * the parameter tree shows) with fuzzy scoring, so multi-word and
 * slightly-misspelled queries land on the right parameter.
 */
export interface ParameterSearchEntry {
  /** Dotted parameter path, e.g. gov.irs.credits.ctc.amount.base[0].amount */
  path: string;
  /** Leaf label, e.g. "amount" */
  label: string;
  /** Human-readable breadcrumb, e.g. "IRS → Credits → Child tax credit → Amount" */
  breadcrumb: string;
  unit: string | null;
  description: string | null;
}

const EXCLUDED_PATH_PATTERNS = ['taxsim', 'gov.abolitions', 'pycache'];

function isSearchableParameter(param: any): param is ParameterMetadata {
  return (
    param?.type === 'parameter' &&
    Boolean(param.label) &&
    Boolean(param.economy || param.household) &&
    !EXCLUDED_PATH_PATTERNS.some((pattern) => param.parameter.includes(pattern))
  );
}

export function buildParameterSearchEntries(
  parameters: ParameterMetadataCollection
): ParameterSearchEntry[] {
  return Object.values(parameters)
    .filter(isSearchableParameter)
    .map((param) => {
      const labels = getHierarchicalLabels(param.parameter, parameters);
      return {
        path: param.parameter,
        label: param.label ?? param.parameter,
        breadcrumb: formatLabelParts(labels),
        unit: param.unit ?? null,
        description: param.description ?? null,
      };
    });
}

const FUSE_OPTIONS: IFuseOptions<ParameterSearchEntry> = {
  keys: [
    { name: 'breadcrumb', weight: 0.7 },
    { name: 'path', weight: 0.2 },
    { name: 'label', weight: 0.1 },
  ],
  threshold: 0.35,
  ignoreLocation: true,
  minMatchCharLength: 2,
};

/** Cap on how many prefiltered candidates get fuzzy re-ranked per query. */
const RERANK_CANDIDATE_CAP = 4000;

export interface ParameterSearchIndex {
  entries: ParameterSearchEntry[];
  /** Lowercased breadcrumb + path per entry, for the fast prefilter. */
  haystacks: string[];
  /** Full fuzzy index — the slow path, used only when the prefilter finds nothing. */
  fuse: Fuse<ParameterSearchEntry>;
}

export function createParameterSearchIndex(entries: ParameterSearchEntry[]): ParameterSearchIndex {
  return {
    entries,
    haystacks: entries.map((entry) => `${entry.breadcrumb} ${entry.path}`.toLowerCase()),
    fuse: new Fuse(entries, FUSE_OPTIONS),
  };
}

/**
 * Two-stage search, sized for as-you-type latency over ~50k entries:
 *
 * 1. Fast path: require every query token as a substring (a few ms),
 *    then fuzzy re-rank only those candidates.
 * 2. Slow path: only when the prefilter finds nothing (e.g. typos),
 *    fall back to full fuzzy search.
 */
export function searchParameters(
  index: ParameterSearchIndex,
  query: string,
  limit = 10
): ParameterSearchEntry[] {
  const trimmed = query.trim().toLowerCase();
  if (trimmed.length < 2) {
    return [];
  }

  const tokens = trimmed.split(/\s+/);
  const candidates: ParameterSearchEntry[] = [];
  for (let i = 0; i < index.haystacks.length; i++) {
    const haystack = index.haystacks[i];
    if (tokens.every((token) => haystack.includes(token))) {
      candidates.push(index.entries[i]);
      if (candidates.length >= RERANK_CANDIDATE_CAP) {
        break;
      }
    }
  }

  if (candidates.length > 0) {
    if (candidates.length <= limit) {
      return candidates;
    }
    return new Fuse(candidates, FUSE_OPTIONS)
      .search(trimmed, { limit })
      .map((result) => result.item);
  }

  return index.fuse.search(trimmed, { limit }).map((result) => result.item);
}

/**
 * Memoized selectors: entries and index are computed once per metadata
 * load and shared by every consumer (Build page now; the agent's locate
 * stage later).
 */
export const selectParameterSearchEntries = createSelector(
  [(state: RootState) => state.metadata.parameters],
  (parameters): ParameterSearchEntry[] =>
    parameters ? buildParameterSearchEntries(parameters) : []
);

export const selectParameterSearchIndex = createSelector(
  [selectParameterSearchEntries],
  (entries): ParameterSearchIndex => createParameterSearchIndex(entries)
);

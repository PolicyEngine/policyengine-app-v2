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
  /** Contributed/experimental parameter (gov.contrib.*) */
  isContrib: boolean;
  /** Two-letter state code for state parameters (gov.states.xx.*, gov.contrib.states.xx.*) */
  stateCode: string | null;
}

const STATE_PATH_PATTERN = /^gov\.(?:contrib\.)?states\.([a-z]{2})\./;

export interface ParameterSearchFilters {
  /** Include gov.contrib.* experimental parameters (default false) */
  includeContrib: boolean;
  /** 'all' | 'federal' | a two-letter state code */
  stateScope: string;
}

export const DEFAULT_SEARCH_FILTERS: ParameterSearchFilters = {
  includeContrib: false,
  stateScope: 'all',
};

function matchesFilters(entry: ParameterSearchEntry, filters: ParameterSearchFilters): boolean {
  if (!filters.includeContrib && entry.isContrib) {
    return false;
  }
  if (filters.stateScope === 'federal' && entry.stateCode) {
    return false;
  }
  if (
    filters.stateScope !== 'all' &&
    filters.stateScope !== 'federal' &&
    entry.stateCode &&
    entry.stateCode !== filters.stateScope
  ) {
    return false;
  }
  return true;
}

/** Distinct state codes present in the entries, sorted (for scope dropdowns). */
export function listStateCodes(entries: ParameterSearchEntry[]): string[] {
  return [
    ...new Set(entries.map((e) => e.stateCode).filter((c): c is string => Boolean(c))),
  ].sort();
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
        isContrib: param.parameter.startsWith('gov.contrib.'),
        stateCode: STATE_PATH_PATTERN.exec(param.parameter)?.[1] ?? null,
      };
    });
}

const FUSE_OPTIONS: IFuseOptions<ParameterSearchEntry> = {
  keys: [
    { name: 'breadcrumb', weight: 0.55 },
    // Leaf labels are often the most information-dense part of the
    // hierarchy, so they get their own strong weight beyond appearing
    // at the end of the breadcrumb.
    { name: 'label', weight: 0.3 },
    { name: 'path', weight: 0.15 },
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
    haystacks: entries.map((entry) =>
      `${entry.breadcrumb} ${entry.label} ${entry.path}`.toLowerCase()
    ),
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
  limit = 10,
  filters: ParameterSearchFilters = DEFAULT_SEARCH_FILTERS
): ParameterSearchEntry[] {
  const trimmed = query.trim().toLowerCase();
  if (trimmed.length < 2) {
    return [];
  }

  const tokens = trimmed.split(/\s+/);
  const candidates: ParameterSearchEntry[] = [];
  for (let i = 0; i < index.haystacks.length; i++) {
    const entry = index.entries[i];
    if (!matchesFilters(entry, filters)) {
      continue;
    }
    const haystack = index.haystacks[i];
    if (tokens.every((token) => haystack.includes(token))) {
      candidates.push(entry);
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

  // Typo fallback: full fuzzy search, filtered after ranking. Fetch a
  // padded window so filtering still leaves up to `limit` results.
  return index.fuse
    .search(trimmed, { limit: limit * 10 })
    .map((result) => result.item)
    .filter((entry) => matchesFilters(entry, filters))
    .slice(0, limit);
}

/**
 * How many matches the current filters are hiding for this query —
 * lets the UI say "N more hidden by filters" instead of a bare empty
 * state.
 */
export function countHiddenByFilters(
  index: ParameterSearchIndex,
  query: string,
  limit: number,
  filters: ParameterSearchFilters
): number {
  const unfiltered = searchParameters(index, query, limit, {
    includeContrib: true,
    stateScope: 'all',
  });
  const filtered = searchParameters(index, query, limit, filters);
  return Math.max(0, unfiltered.length - filtered.length);
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

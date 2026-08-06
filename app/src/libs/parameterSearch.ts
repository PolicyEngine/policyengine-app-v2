import { createSelector } from '@reduxjs/toolkit';
import Fuse, { IFuseOptions } from 'fuse.js';
import { priorFactor } from '@/libs/searchPriors';
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
  includeScore: true,
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

/** Re-rank options: score everything, gate nothing — the coverage
 * prefilter already decided what qualifies. */
const RERANK_FUSE_OPTIONS: IFuseOptions<ParameterSearchEntry> = {
  ...FUSE_OPTIONS,
  threshold: 1,
};

/** Fuzzy-rank candidates, then adjust by the derived priors. */
function rankWithPriors(
  candidates: ParameterSearchEntry[],
  query: string,
  limit: number
): ParameterSearchEntry[] {
  const ranked = new Fuse(candidates, RERANK_FUSE_OPTIONS)
    .search(query)
    .map((result) => ({
      entry: result.item,
      adjusted: (result.score ?? 0.5) * priorFactor(result.item.path),
    }))
    .sort((a, b) => a.adjusted - b.adjusted)
    .slice(0, limit)
    .map((item) => item.entry);
  if (ranked.length >= Math.min(limit, candidates.length)) {
    return ranked;
  }
  // Fuse can still drop candidates whose score rounds to nothing; top
  // up from the coverage order so qualified entries never vanish.
  const seen = new Set(ranked.map((entry) => entry.path));
  for (const entry of candidates) {
    if (ranked.length >= limit) {
      break;
    }
    if (!seen.has(entry.path)) {
      ranked.push(entry);
    }
  }
  return ranked;
}

/**
 * Two-stage search, sized for as-you-type latency over ~90k entries:
 *
 * 1. Fast path: adaptive coverage — count how many query tokens each
 *    entry contains and keep the entries achieving the best coverage.
 *    Conversational filler ("why does the…") costs every entry equally,
 *    so full-sentence queries still land without any stopword list.
 * 2. Fuzzy re-rank of those candidates, adjusted by derived priors
 *    (path depth, bracket internals, live usage counts).
 * 3. Slow path: only when nothing matches any token (e.g. typos), fall
 *    back to full fuzzy search.
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

  const tokens = [...new Set(trimmed.split(/\s+/).filter((token) => token.length >= 2))];

  // Token score: 1 for an exact substring hit; 0.6 when only a prefix
  // of the token (≥3 chars) appears — derived stemming, so "maximum"
  // still credits entries that say "max" without any word list.
  const tokenScore = (haystack: string, token: string): number => {
    if (haystack.includes(token)) {
      return 1;
    }
    if (token.length > 4) {
      for (let cut = token.length - 1; cut >= 3; cut--) {
        if (haystack.includes(token.slice(0, cut))) {
          return 0.6;
        }
      }
    }
    return 0;
  };

  // Pass 1: score coverage per entry and find the best achieved.
  const coverage = new Float32Array(index.haystacks.length);
  let bestCoverage = 0;
  for (let i = 0; i < index.haystacks.length; i++) {
    if (!matchesFilters(index.entries[i], filters)) {
      continue;
    }
    const haystack = index.haystacks[i];
    let matched = 0;
    for (const token of tokens) {
      matched += tokenScore(haystack, token);
    }
    coverage[i] = matched;
    if (matched > bestCoverage) {
      bestCoverage = matched;
    }
  }

  // Pass 2: keep entries within a tolerance band of the best coverage,
  // so exact-wording entries don't monopolize over close paraphrases.
  // Best-coverage entries are collected first so the candidate cap can
  // never crowd them out with partial matches.
  if (bestCoverage > 0) {
    const floor = Math.max(bestCoverage - 0.5, bestCoverage * 0.75, 0.6);
    const candidates: ParameterSearchEntry[] = [];
    for (let i = 0; i < index.haystacks.length; i++) {
      if (coverage[i] >= bestCoverage && candidates.length < RERANK_CANDIDATE_CAP) {
        candidates.push(index.entries[i]);
      }
    }
    for (let i = 0; i < index.haystacks.length; i++) {
      if (
        coverage[i] >= floor &&
        coverage[i] < bestCoverage &&
        candidates.length < RERANK_CANDIDATE_CAP
      ) {
        candidates.push(index.entries[i]);
      }
    }
    if (candidates.length === 1) {
      return candidates;
    }
    return rankWithPriors(candidates, trimmed, limit);
  }

  // Typo fallback: full fuzzy search, filtered after ranking. Fetch a
  // padded window so filtering still leaves up to `limit` results.
  const fallback = index.fuse
    .search(trimmed, { limit: limit * 10 })
    .map((result) => ({
      entry: result.item,
      adjusted: (result.score ?? 0.5) * priorFactor(result.item.path),
    }))
    .filter((ranked) => matchesFilters(ranked.entry, filters))
    .sort((a, b) => a.adjusted - b.adjusted)
    .slice(0, limit);
  return fallback.map((ranked) => ranked.entry);
}

export interface ParameterSearchGroup {
  /** Folder breadcrumb (everything above the leaf); '' when unknown */
  folder: string;
  entries: ParameterSearchEntry[];
}

/**
 * Organizes flat results into a hierarchy for display: parameters
 * sharing a parent folder cluster under a folder header (in rank
 * order of their best hit), with folders listed before standalone
 * parameters. Mirrors how the parameter tree is organized, so search
 * results teach the structure instead of flattening it away.
 */
export function groupSearchResults(results: ParameterSearchEntry[]): ParameterSearchGroup[] {
  const byFolder = new Map<string, ParameterSearchGroup>();
  const order: ParameterSearchGroup[] = [];

  for (const entry of results) {
    const parts = entry.breadcrumb.split(' → ');
    const folder = parts.slice(0, -1).join(' → ');
    let group = byFolder.get(folder);
    if (!group) {
      group = { folder, entries: [] };
      byFolder.set(folder, group);
      order.push(group);
    }
    group.entries.push(entry);
  }

  const folders = order.filter((group) => group.entries.length > 1 && group.folder);
  const standalone = order.filter((group) => group.entries.length === 1 || !group.folder);
  return [...folders, ...standalone];
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
  return unfiltered.filter((entry) => !matchesFilters(entry, filters)).length;
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

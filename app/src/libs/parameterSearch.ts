import { createSelector } from '@reduxjs/toolkit';
import Fuse, { IFuseOptions } from 'fuse.js';
import { priorFactor } from '@/libs/searchPriors';
import type { RootState } from '@/store';
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
  // A state selection means that state's parameters only — federal
  // parameters (no stateCode) are excluded along with other states.
  if (
    filters.stateScope !== 'all' &&
    filters.stateScope !== 'federal' &&
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

/**
 * Concept clusters derived from the tree itself: every node pairs its
 * path segment with its label (segment `eitc` ↔ "Earned Income Tax
 * Credit"; segment `earned_income` ↔ the same label), and pairs that
 * share a member merge into one cluster. A query hitting any variant
 * then credits entries carrying any other — "eitc" finds California's
 * `earned_income` parameters and vice versa — with no curated lists.
 * Oversized clusters are dropped as generic hubs ("rate", "amount").
 */
const MAX_CLUSTER_SIZE = 10;

export function buildConceptClusters(collection: ParameterMetadataCollection): string[][] {
  const parent = new Map<string, string>();
  const find = (x: string): string => {
    let root = x;
    while (parent.get(root) !== undefined && parent.get(root) !== root) {
      root = parent.get(root)!;
    }
    parent.set(x, root);
    return root;
  };
  const ensure = (x: string) => {
    if (!parent.has(x)) {
      parent.set(x, x);
    }
  };
  const union = (a: string, b: string) => {
    ensure(a);
    ensure(b);
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) {
      parent.set(ra, rb);
    }
  };

  for (const node of Object.values(collection) as any[]) {
    const path: string | undefined = node?.parameter;
    const label: string | undefined = node?.label;
    if (!path || !label) {
      continue;
    }
    const segment = path
      .split('.')
      .pop()!
      .replace(/\[\d+\]$/, '')
      .replace(/_/g, ' ')
      .toLowerCase()
      .trim();
    const phrase = label.toLowerCase().trim();
    if (segment.length < 3 || segment === phrase) {
      continue;
    }
    // Keep pairs that look like abbreviation ↔ expansion or word ↔
    // multi-word name; skip unrelated decorative labels.
    const looksRelated =
      phrase.startsWith(segment) ||
      phrase.split(/\s+/).length >= 2 ||
      segment.split(/\s+/).length >= 2;
    if (!looksRelated) {
      continue;
    }
    union(segment, phrase);
  }

  const clusters = new Map<string, Set<string>>();
  for (const key of parent.keys()) {
    if (!key) {
      continue;
    }
    const root = find(key);
    if (!clusters.has(root)) {
      clusters.set(root, new Set());
    }
    clusters.get(root)!.add(key);
  }
  return [...clusters.values()]
    .filter((members) => members.size >= 2 && members.size <= MAX_CLUSTER_SIZE)
    .map((members) => [...members]);
}

/**
 * Concept aliases: a variant → the canonical phrase it names.
 *
 * Two derivations, no lists. A node pairs its path segment with its
 * label (`ctc` ↔ "child tax credit"), and every multi-word label yields
 * its own initialism ("Universal Credit" → `uc`) — which is how an
 * acronym the tree never spells out still finds its program.
 *
 * Unlike the clusters, aliases never merge transitively: a variant that
 * names different things in different places is ambiguous, and an
 * ambiguous variant is dropped rather than pulling unrelated concepts
 * into one bucket. ("earned income" appears under EITC, SNAP deductions
 * and a Georgia retirement cap; canonicalizing it to any one of those
 * would be a lie.)
 */
const ALIAS_DOMINANCE = 0.6;

/** Words too structural to carry an initialism's meaning. */
const INITIALISM_SKIP = new Set(['and', 'or', 'of', 'the', 'for', 'to', 'in', 'a', 'an']);

function normalizePhrase(label: string): string {
  return label.toLowerCase().replace(/\.$/, '').replace(/\s+/g, ' ').trim();
}

/** "Child Tax Credit" → "ctc"; returns null when there is no acronym to make. */
export function initialismOf(phrase: string): string | null {
  const words = phrase.split(/\s+/).filter((word) => word && !INITIALISM_SKIP.has(word));
  if (words.length < 2) {
    return null;
  }
  const letters = words
    .map((word) => word[0])
    .filter((letter) => /[a-z]/.test(letter))
    .join('');
  return letters.length >= 2 ? letters : null;
}

export function buildConceptAliases(collection: ParameterMetadataCollection): Map<string, string> {
  const counts = new Map<string, Map<string, number>>();
  const record = (variant: string, phrase: string) => {
    if (!variant || variant === phrase || variant.length < 2) {
      return;
    }
    const byPhrase = counts.get(variant) ?? new Map<string, number>();
    byPhrase.set(phrase, (byPhrase.get(phrase) ?? 0) + 1);
    counts.set(variant, byPhrase);
  };

  for (const node of Object.values(collection) as any[]) {
    const path: string | undefined = node?.parameter;
    const label: string | undefined = node?.label;
    if (!path || !label) {
      continue;
    }
    const phrase = normalizePhrase(label);
    if (phrase.split(' ').length < 2) {
      continue;
    }
    // Only acronyms become aliases. Pairing a path segment with its
    // label reads plausibly — "income" sits on a node labelled "income
    // elasticity of labor supply" — but rewriting a common word to one
    // long label is how a query about income tax ends up about labor
    // supply elasticity. Segment ↔ label stays in the clusters, which
    // only decide candidacy and cannot rewrite anything.
    const initialism = initialismOf(phrase);
    if (initialism) {
      record(initialism, phrase);
    }
  }

  const aliases = new Map<string, string>();
  for (const [variant, byPhrase] of counts) {
    let best = '';
    let bestCount = 0;
    let total = 0;
    for (const [phrase, count] of byPhrase) {
      total += count;
      if (count > bestCount) {
        best = phrase;
        bestCount = count;
      }
    }
    // A variant that means different things in different corners of the
    // tree is not an alias for any of them.
    if (bestCount / total >= ALIAS_DOMINANCE) {
      aliases.set(variant, best);
    }
  }
  return aliases;
}

/**
 * Rewrites a query into canonical phrases: "ctc" and "child tax credit"
 * become the same string, so they rank identically instead of each
 * favouring the entries that happen to spell it their way.
 */
export function canonicalizeQuery(query: string, aliases: Map<string, string>): string {
  let text = query.toLowerCase().trim();
  if (!text) {
    return text;
  }
  // Phrases first and longest first, so "earned income tax credit" is not
  // consumed word by word.
  const phrases = [...aliases.keys()]
    .filter((variant) => variant.includes(' '))
    .sort((a, b) => b.length - a.length);
  for (const phrase of phrases) {
    if (text.includes(phrase)) {
      text = text.split(phrase).join(aliases.get(phrase)!);
    }
  }
  return text
    .split(/\s+/)
    .map((token) => aliases.get(token) ?? token)
    .join(' ');
}

/** The canonical phrases an entry carries, for its searchable text. */
function entryConceptText(entry: ParameterSearchEntry, aliases: Map<string, string>): string {
  const keys = new Set<string>();
  for (const segment of entry.path.split('.')) {
    keys.add(
      segment
        .replace(/\[\d+\]$/, '')
        .replace(/_/g, ' ')
        .toLowerCase()
    );
  }
  keys.add(normalizePhrase(entry.label));
  const phrases = new Set<string>();
  for (const key of keys) {
    const canonical = aliases.get(key);
    if (canonical) {
      phrases.add(canonical);
    }
  }
  return [...phrases].join(' ');
}

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
  /** Derived concept clusters (see buildConceptClusters). */
  clusters: string[][];
  /** Variant lookup: cluster member → its cluster. */
  clusterByMember: Map<string, string[]>;
  /** Variant → canonical phrase (see buildConceptAliases). */
  aliases: Map<string, string>;
}

export function createParameterSearchIndex(
  entries: ParameterSearchEntry[],
  clusters: string[][] = [],
  aliases = new Map<string, string>()
): ParameterSearchIndex {
  const clusterByMember = new Map<string, string[]>();
  for (const cluster of clusters) {
    for (const member of cluster) {
      clusterByMember.set(member, cluster);
    }
  }
  // Fuse construction over ~20k entries costs hundreds of ms and is only
  // needed when the fast prefilter finds nothing, so build it lazily.
  let fuseInstance: Fuse<ParameterSearchEntry> | null = null;
  return {
    entries,
    // The canonical phrases go in the haystack too, so an entry spelled
    // one way is found by a query normalized the other way.
    haystacks: entries.map((entry) =>
      `${entry.breadcrumb} ${entry.label} ${entry.path} ${entry.path.replace(/[._]/g, ' ')} ${entryConceptText(entry, aliases)}`.toLowerCase()
    ),
    get fuse() {
      fuseInstance ??= new Fuse(entries, FUSE_OPTIONS);
      return fuseInstance;
    },
    clusters,
    clusterByMember,
    aliases,
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
  const trimmed = canonicalizeQuery(query, index.aliases);
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
    if (token.length > 4 && !token.includes(' ')) {
      for (let cut = token.length - 1; cut >= 3; cut--) {
        if (haystack.includes(token.slice(0, cut))) {
          return 0.6;
        }
      }
    }
    return 0;
  };

  // Expand the query into variant groups via the derived concept
  // clusters: a group is satisfied by any of its variants, so "eitc"
  // credits entries that only say "earned income tax credit" (and the
  // reverse) without double counting.
  const groups: string[][] = [];
  const consumed = new Set<string>();
  for (const cluster of index.clusters) {
    for (const member of cluster) {
      if (member.includes(' ') && trimmed.includes(member)) {
        groups.push(cluster);
        for (const word of member.split(/\s+/)) {
          consumed.add(word);
        }
        break;
      }
    }
  }
  for (const token of tokens) {
    if (consumed.has(token)) {
      continue;
    }
    groups.push(index.clusterByMember.get(token) ?? [token]);
  }
  if (groups.length === 0) {
    return [];
  }

  // Pass 1: score coverage per entry and find the best achieved.
  const coverage = new Float32Array(index.haystacks.length);
  let bestCoverage = 0;
  for (let i = 0; i < index.haystacks.length; i++) {
    if (!matchesFilters(index.entries[i], filters)) {
      continue;
    }
    const haystack = index.haystacks[i];
    let matched = 0;
    for (const group of groups) {
      let best = 0;
      for (const variant of group) {
        const score = tokenScore(haystack, variant);
        if (score > best) {
          best = score;
        }
        if (best === 1) {
          break;
        }
      }
      matched += best;
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

export const selectConceptClusters = createSelector(
  [(state: RootState) => state.metadata.parameters],
  (parameters): string[][] => (parameters ? buildConceptClusters(parameters) : [])
);

export const selectConceptAliases = createSelector(
  [(state: RootState) => state.metadata.parameters],
  (parameters): Map<string, string> =>
    parameters ? buildConceptAliases(parameters) : new Map<string, string>()
);

export const selectParameterSearchIndex = createSelector(
  [selectParameterSearchEntries, selectConceptClusters, selectConceptAliases],
  (entries, clusters, aliases): ParameterSearchIndex =>
    createParameterSearchIndex(entries, clusters, aliases)
);

export const selectParameterEntriesByPath = createSelector(
  [selectParameterSearchEntries],
  (entries): Map<string, ParameterSearchEntry> =>
    new Map(entries.map((entry) => [entry.path, entry]))
);

export const selectAddableParameterPaths = createSelector(
  [selectParameterSearchEntries],
  (entries): Set<string> => new Set(entries.map((entry) => entry.path))
);

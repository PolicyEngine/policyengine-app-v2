import { createSelector } from '@reduxjs/toolkit';
import Fuse, { IFuseOptions } from 'fuse.js';
import type { RootState } from '@/store';
import { ParameterMetadata, ParameterMetadataCollection } from '@/types/metadata/parameterMetadata';
import { formatLabelParts } from '../utils/parameterLabels';
import { getCurrentValue } from '../utils/parameterValues';
import { priorFactor, priorOffset } from './searchPriors';

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
  /**
   * Two-letter state code for state parameters (gov.states.xx.*,
   * gov.contrib.states.xx.*) and for local ones, which belong to their
   * state (gov.local.xx.*)
   */
  stateCode: string | null;
  /**
   * Set on a search result that stands for a federal parameter's whole
   * breakdown by state (`gov.usda.snap.….MN`, `….MT`, …): the number of
   * jurisdictions it holds. The entry is one member; picking it opens the
   * breakdown, so the label and breadcrumb name the parameter, not the state.
   */
  jurisdictionCount?: number;
  /** With `jurisdictionCount`: the parameter's own path, which the states' values sit under. */
  breakdownPath?: string;
  /**
   * For a bracket member (…ctc.amount.base[0].amount), the label of the
   * schedule it belongs to ("Child Tax Credit amount"). The breadcrumb
   * skips the schedule's own node, and the member's label alone says
   * only "amount", so search reads this alongside it.
   */
  scheduleLabel?: string | null;
  /** Everyday names the metadata never uses (see SEARCH_KEYWORDS). */
  keywords?: string;
}

/**
 * Everyday names for parameters whose labels and descriptions never use
 * them, so no derivation can reach them: what a searcher calls the UC
 * taper is "Universal Credit earned income reduction rate" in the model.
 * Keyed by exact path, so a name applies only where its parameter
 * exists. Last resort — fix a label upstream when one can say it.
 */
export const SEARCH_KEYWORDS: Readonly<Record<string, string>> = {
  'gov.dwp.universal_credit.means_test.reduction_rate': 'taper rate',
  'gov.dwp.universal_credit.elements.child.limit.child_count': 'two child limit',
  'gov.dwp.tax_credits.child_tax_credit.limit.child_count': 'two child limit',
  'gov.hmrc.income_tax.allowances.personal_allowance.maximum_ANI': 'taper threshold',
};

/**
 * The postal codes a federal parameter keys its per-jurisdiction values
 * by: the states, DC, the territories, the freely associated states and
 * the military codes. Fixed, not read from the metadata, which names some
 * states only by their code.
 */
const USPS_CODES = new Set(
  (
    'AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ ' +
    'NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY DC PR GU VI AS MP FM MH PW AA AE AP'
  ).split(' ')
);

const STATE_PATH_PATTERN = /^gov\.(?:contrib\.)?(?:states|local)\.([a-z]{2})\./;

/**
 * County and city parameters. Contributed ones (gov.contrib.local.nyc.*)
 * carry no state code, so the path is the only sign they are not federal.
 */
function isLocalPath(path: string): boolean {
  return path.startsWith('gov.local.') || path.startsWith('gov.contrib.local.');
}

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

export function matchesFilters(
  entry: ParameterSearchEntry,
  filters: ParameterSearchFilters
): boolean {
  if (!filters.includeContrib && entry.isContrib) {
    return false;
  }
  if (filters.stateScope === 'federal' && (entry.stateCode || isLocalPath(entry.path))) {
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

/** Lowercase letters-only form, so "California's" and "california" compare equal. */
function plainWords(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z]+/g, ' ')
    .trim();
}

/**
 * State names as the metadata gives them (`gov.states.ny` → "New York"),
 * keyed by their plain lowercase form. Nodes labelled only with their
 * code ("fl") add nothing; a capitalized code still names them.
 */
export function buildStateNames(collection: ParameterMetadataCollection): Map<string, string> {
  const names = new Map<string, string>();
  for (const [path, node] of Object.entries(collection)) {
    const code = /^gov\.states\.([a-z]{2})$/.exec(path)?.[1];
    const name = code && node?.label ? plainWords(node.label) : '';
    if (code && name && name !== code) {
      names.set(name, code);
    }
  }
  return names;
}

/**
 * The states a query names: by name ("new york", "california's") or by
 * capitalized postal code ("NY"). Lowercase codes don't count — "in",
 * "or" and "me" are words first. Longer names match first, so "west
 * virginia" is not also read as Virginia.
 */
function statesNamedIn(query: string, canonical: string, index: ParameterSearchIndex): Set<string> {
  const named = new Set<string>();
  let text = ` ${plainWords(canonical)} `;
  for (const [name, code] of index.stateNames) {
    if (text.includes(` ${name} `)) {
      named.add(code);
      text = text.split(` ${name} `).join(' ');
    }
  }
  for (const token of query.split(/[^A-Za-z]+/)) {
    if (/^[A-Z]{2}$/.test(token) && index.stateCodes.has(token.toLowerCase())) {
      named.add(token.toLowerCase());
    }
  }
  return named;
}

/** The words of the state names a query names ("new", "york" for "new york eitc"). */
function stateNameWords(canonical: string, index: ParameterSearchIndex): Set<string> {
  const words = new Set<string>();
  const text = ` ${plainWords(canonical)} `;
  for (const [name] of index.stateNames) {
    if (text.includes(` ${name} `)) {
      name.split(' ').forEach((word) => words.add(word));
    }
  }
  return words;
}

/**
 * Jurisdiction prior: parameters outside the query's jurisdiction — the
 * named states (with their local parameters), or federal when no state
 * is named — have their fuzzy score multiplied by this. State labels
 * restate the program name ("Georgia child tax credit amount") where
 * federal leaves lean on their breadcrumb, so fuzzy scoring alone ranks
 * fifty state copies above the federal original.
 *
 * A multiplier rather than a hard tier, so a clearly better match still
 * wins: a federal entry has to be a comparable match to outrank a state
 * one, not just be federal. Local parameters get no further penalty
 * below state ones — a query naming a county ("Harris County rides")
 * is naming a local program.
 */
const OUT_OF_JURISDICTION_FACTOR = 3;

function inQueryJurisdiction(entry: ParameterSearchEntry, namedStates: Set<string>): boolean {
  if (namedStates.size > 0) {
    return entry.stateCode !== null && namedStates.has(entry.stateCode);
  }
  return !entry.stateCode && !isLocalPath(entry.path);
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

/** A path's last key without its bracket index: `…base[0]` → `base`. */
function lastKeyOf(path: string): string {
  return (path.split('.').pop() ?? path).replace(/\[\d+\]$/, '');
}

/**
 * Whether a label only restates its path key, exactly (`NORTHERN_IRELAND`
 * → "NORTHERN IRELAND", `vat` → "vat"): a placeholder the model filled
 * in, not a name anyone wrote.
 */
export function isKeyLabel(path: string, label: string): boolean {
  return label.trim() === lastKeyOf(path).replace(/_/g, ' ');
}

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
    // Contributed reforms name proposals, not the programs a searcher
    // abbreviates ("UBI Center" is not what "UC" means); a label that
    // only restates its key ("NORTHERN IRELAND" on `…NORTHERN_IRELAND`)
    // was never written as a name; and what search never shows
    // (gov.abolitions) cannot say what a query means. None gets a vote.
    if (
      !path ||
      !label ||
      path.startsWith('gov.contrib.') ||
      EXCLUDED_PATH_PATTERNS.some((pattern) => path.includes(pattern)) ||
      isKeyLabel(path, label)
    ) {
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

/** A bracket member's schedule: `…amount.base[0].amount` → `…amount.base`. */
const BRACKET_MEMBER_PATTERN = /^(.+)\[\d+\]\.[^.[\]]+$/;

function scheduleLabelOf(path: string, parameters: ParameterMetadataCollection): string | null {
  const schedule = BRACKET_MEMBER_PATTERN.exec(path)?.[1];
  return (schedule && parameters[schedule]?.label) || null;
}

/**
 * Whether the metadata keys values by US state: only a model with
 * `gov.states` does. Elsewhere a two-letter key is not a postal code — a
 * UK key `WA` or `SC` must not read as Washington or South Carolina.
 */
export function hasStateKeys(paths: Iterable<string>): boolean {
  for (const path of paths) {
    if (path === 'gov.states' || path.startsWith('gov.states.')) {
      return true;
    }
  }
  return false;
}

/**
 * Keys that name a place, read as a place ("Business rates revenue:
 * London") rather than as a qualifier ("Pension Credit minimum guarantee
 * (single)"). The UK's nations and regions, which the model keys values by.
 */
const PLACE_KEYS = new Set([
  'UNITED_KINGDOM',
  'GREAT_BRITAIN',
  'ENGLAND',
  'ENGLAND_OUTSIDE_LONDON',
  'SCOTLAND',
  'WALES',
  'NORTHERN_IRELAND',
  'LONDON',
  'NORTH_EAST',
  'NORTH_WEST',
  'YORKSHIRE',
  'YORKSHIRE_AND_THE_HUMBER',
  'EAST_MIDLANDS',
  'WEST_MIDLANDS',
  'EAST_OF_ENGLAND',
  'SOUTH_EAST',
  'SOUTH_WEST',
]);

const MINOR_WORDS = new Set(['and', 'of', 'the', 'upon', 'on']);

function placeName(key: string): string {
  return key
    .toLowerCase()
    .split('_')
    .map((word, index) =>
      index > 0 && MINOR_WORDS.has(word) ? word : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(' ');
}

/** Above this many key-labelled members, a parent's members keep their keys (see memberLabelOf). */
const MAX_NAMED_MEMBERS = 16;

/** Per parent, how many of its leaves are labelled only with their key. */
function countKeyLabelledMembers(parameters: ParameterMetadataCollection): Map<string, number> {
  const counts = new Map<string, number>();
  for (const param of Object.values(parameters) as any[]) {
    const path: string | undefined = param?.parameter;
    if (param?.type === 'parameter' && path && param.label && isKeyLabel(path, param.label)) {
      const parent = path.slice(0, path.lastIndexOf('.'));
      counts.set(parent, (counts.get(parent) ?? 0) + 1);
    }
  }
  return counts;
}

/**
 * A leaf labelled only with its key (`minimum_guarantee.SINGLE` →
 * "SINGLE", `revenue.LONDON` → "LONDON") says nothing on its own and
 * nothing to a search for its program. Read it as its parent's member:
 * "Pension Credit minimum guarantee (single)", "Revenue: London". Null
 * when the label is a real one, or the parent has no name to lend.
 */
function memberLabelOf(
  path: string,
  label: string,
  parameters: ParameterMetadataCollection,
  stateKeys: boolean,
  membersByParent: Map<string, number>
): string | null {
  const key = lastKeyOf(path);
  if (!/^[A-Z][A-Z0-9_]*$/.test(key) || !isKeyLabel(path, label)) {
    return null;
  }
  // A state's value of a federal parameter is a breakdown member, named apart.
  if (stateKeys && USPS_CODES.has(key.split('_')[0])) {
    return null;
  }
  const parentPath = path.slice(0, path.lastIndexOf('.'));
  const parentLabel = parameters[parentPath]?.label?.trim();
  if (!parentLabel || isKeyLabel(parentPath, parentLabel)) {
    return null;
  }
  // A long list of keys (a value per county) is a lookup table: its
  // members say no more than the parent, and a hundred copies of the
  // parent's name would crowd out the parameters a search is after.
  if ((membersByParent.get(parentPath) ?? 0) > MAX_NAMED_MEMBERS) {
    return null;
  }
  const parent = parentLabel.charAt(0).toUpperCase() + parentLabel.slice(1);
  const isPlace = PLACE_KEYS.has(key) || path.startsWith('gov.local_authorities.');
  return isPlace
    ? `${parent}: ${placeName(key)}`
    : `${parent} (${key.toLowerCase().replace(/_/g, ' ')})`;
}

/**
 * Breadcrumb labels as the tree shows them, except that a key standing in
 * for a label reads as a name: `vat` → "VAT", `uc_deductions` → "UC
 * deductions", rather than "Vat" and "Uc deductions".
 */
function breadcrumbLabels(path: string, parameters: ParameterMetadataCollection): string[] {
  // As getHierarchicalLabels: every labelled node below `gov`, first letter capitalized.
  const parts = path.split('.');
  return parts.slice(1).flatMap((_, i) => {
    const nodePath = parts.slice(0, i + 2).join('.');
    const label = parameters[nodePath]?.label;
    if (!label) {
      return [];
    }
    if (isKeyLabel(nodePath, label) && /^[a-z][a-z0-9_]*$/.test(lastKeyOf(nodePath))) {
      return [keyName(lastKeyOf(nodePath))];
    }
    return [label.charAt(0).toUpperCase() + label.slice(1)];
  });
}

export function buildParameterSearchEntries(
  parameters: ParameterMetadataCollection
): ParameterSearchEntry[] {
  const stateKeys = hasStateKeys(Object.keys(parameters));
  const membersByParent = countKeyLabelledMembers(parameters);
  // A federal program's value for one state ("gov.usda.snap.….MT") is that
  // state's, like a parameter under gov.states: its key names the state.
  const stateKeyOf = (path: string): string | null => {
    if (!stateKeys) {
      return null;
    }
    const segments = path.split('.');
    for (let i = segments.length - 1; i > 0; i--) {
      if (USPS_CODES.has(segments[i])) {
        return segments[i].toLowerCase();
      }
    }
    return null;
  };
  return Object.values(parameters)
    .filter(isSearchableParameter)
    .map((param) => {
      const labels = breadcrumbLabels(param.parameter, parameters);
      const memberLabel = memberLabelOf(
        param.parameter,
        param.label,
        parameters,
        stateKeys,
        membersByParent
      );
      if (memberLabel && labels.length > 0) {
        labels[labels.length - 1] = memberLabel;
      }
      return {
        path: param.parameter,
        label: memberLabel ?? param.label ?? param.parameter,
        breadcrumb: formatLabelParts(labels),
        unit: param.unit ?? null,
        description: param.description ?? null,
        isContrib: param.parameter.startsWith('gov.contrib.'),
        stateCode: STATE_PATH_PATTERN.exec(param.parameter)?.[1] ?? stateKeyOf(param.parameter),
        scheduleLabel: scheduleLabelOf(param.parameter, parameters),
        ...(SEARCH_KEYWORDS[param.parameter] ? { keywords: SEARCH_KEYWORDS[param.parameter] } : {}),
      };
    });
}

/**
 * Labels with their acronyms spelled out, per entry, set as an index is
 * built: "NI employer rate" also reads "national insurance", so a query
 * canonicalized to the phrase ranks it by its label, not only its path.
 */
const spelledOutLabels = new WeakMap<ParameterSearchEntry, string>();

/** The phrases a label's capitalized acronyms stand for ("NI" → "national insurance"). */
function acronymExpansions(label: string, aliases: Map<string, string>): string {
  const phrases = new Set<string>();
  for (const word of label.split(/[^A-Za-z]+/)) {
    const phrase = /^[A-Z]{2,}$/.test(word) ? aliases.get(word.toLowerCase()) : undefined;
    if (phrase) {
      phrases.add(phrase);
    }
  }
  return [...phrases].join(' ');
}

/** A bracket member's schedule label, then its own. */
function labelWithSchedule(entry: ParameterSearchEntry): string {
  return entry.scheduleLabel ? `${entry.scheduleLabel} ${entry.label}` : entry.label;
}

/** What search reads as an entry's label: with its schedule, acronyms spelled out, and keywords. */
function searchLabel(entry: ParameterSearchEntry): string {
  return [labelWithSchedule(entry), spelledOutLabels.get(entry), entry.keywords]
    .filter(Boolean)
    .join(' ');
}

const FUSE_OPTIONS: IFuseOptions<ParameterSearchEntry> = {
  keys: [
    { name: 'breadcrumb', weight: 0.55 },
    // Leaf labels are often the most information-dense part of the
    // hierarchy, so they get their own strong weight beyond appearing
    // at the end of the breadcrumb. A bracket member's label leads with
    // its schedule's, which names what "amount" is the amount of.
    { name: 'label', weight: 0.3, getFn: searchLabel },
    { name: 'path', weight: 0.15 },
  ],
  threshold: 0.35,
  ignoreLocation: true,
  minMatchCharLength: 2,
  includeScore: true,
};

/** Coverage credit for a structural word ("and", "for") found as a word: a tie-breaker. */
const STRUCTURAL_WORD_SCORE = 0.1;

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
  /** State name → code (see buildStateNames), longest name first. */
  stateNames: Map<string, string>;
  /** State codes the entries carry, for recognizing "NY"-style mentions. */
  stateCodes: Set<string>;
  /**
   * Per entry, the name of the state its key names (`….MT` → "montana"),
   * or ''. Kept out of the haystack: only a whole state name in the query
   * matches it, so "minimum" does not find Minnesota's values by prefix.
   */
  stateNameTexts: string[];
  /** A breakdown by state's parent path → how many jurisdictions it has. */
  stateBreakdownSizes: Map<string, number>;
}

/**
 * `gov.usda.snap.….MN` → `gov.usda.snap.…`: the parameter a value keyed
 * by a state belongs to, with the state's key — also a part of a state
 * (`….NY_NYC`, `….AK_NW`), and a state's own breakdown (`….GU.1`, by
 * household size). Null when no state key ends the path.
 */
export function stateBreakdownOf(path: string): { parent: string; state: string } | null {
  const segments = path.split('.');
  let end = segments.length;
  // A state's own breakdown follows its key: sizes, or enum members.
  while (end > 2 && /^(\d+|[A-Z][A-Z0-9_]*)$/.test(segments[end - 1])) {
    const state = /^([A-Z]{2})(?:_[A-Z0-9_]+)?$/.exec(segments[end - 1])?.[1];
    if (state && USPS_CODES.has(state)) {
      return { parent: segments.slice(0, end - 1).join('.'), state: segments[end - 1] };
    }
    end -= 1;
  }
  return null;
}

/**
 * The breakdown by state `path` is a member of, from the known ones, with
 * its key there (`MT`, `CONTIGUOUS_US`); null when it is in none.
 */
function breakdownMemberOf(
  path: string,
  parents: Pick<Set<string>, 'has'>
): { parent: string; key: string } | null {
  const segments = path.split('.');
  for (let end = segments.length; end > 2; end--) {
    if (!/^(\d+|[A-Z][A-Z0-9_]*)$/.test(segments[end - 1])) {
      return null;
    }
    const parent = segments.slice(0, end - 1).join('.');
    if (parents.has(parent)) {
      return { parent, key: segments[end - 1] };
    }
  }
  return null;
}

export function createParameterSearchIndex(
  entries: ParameterSearchEntry[],
  clusters: string[][] = [],
  aliases = new Map<string, string>(),
  stateNames = new Map<string, string>()
): ParameterSearchIndex {
  for (const entry of entries) {
    const spelledOut = acronymExpansions(labelWithSchedule(entry), aliases);
    if (spelledOut) {
      spelledOutLabels.set(entry, spelledOut);
    }
  }
  const clusterByMember = new Map<string, string[]>();
  for (const cluster of clusters) {
    for (const member of cluster) {
      clusterByMember.set(member, cluster);
    }
  }
  // Fuse construction over ~20k entries costs hundreds of ms and is only
  // needed when the fast prefilter finds nothing, so build it lazily.
  let fuseInstance: Fuse<ParameterSearchEntry> | null = null;
  // An entry's state by name, so "montana snap" finds SNAP's Montana values.
  const stateNameOf = new Map([...stateNames].map(([name, code]) => [code, name]));
  // A breakdown by state, once one key names a state, holds its other
  // keys too: SNAP's maximum allotment has CONTIGUOUS_US beside AK and HI.
  // Only a model with gov.states keys values by postal code.
  const breakdownParents = new Set<string>();
  const stateKeys = hasStateKeys(entries.map((entry) => entry.path));
  for (const entry of stateKeys ? entries : []) {
    const breakdown = stateBreakdownOf(entry.path);
    if (breakdown) {
      breakdownParents.add(breakdown.parent);
    }
  }
  const keysByBreakdown = new Map<string, Set<string>>();
  for (const entry of entries) {
    const member = breakdownMemberOf(entry.path, breakdownParents);
    if (member) {
      const keys = keysByBreakdown.get(member.parent) ?? new Set<string>();
      keysByBreakdown.set(member.parent, keys.add(member.key));
    }
  }
  const stateBreakdownSizes = new Map(
    [...keysByBreakdown].map(([parent, keys]) => [parent, keys.size])
  );
  return {
    entries,
    // The canonical phrases go in the haystack too, so an entry spelled
    // one way is found by a query normalized the other way.
    haystacks: entries.map((entry) =>
      `${entry.breadcrumb} ${searchLabel(entry)} ${entry.path} ${entry.path.replace(/[._]/g, ' ')} ${entryConceptText(entry, aliases)}`.toLowerCase()
    ),
    stateNameTexts: entries.map(
      (entry) => (entry.stateCode && stateNameOf.get(entry.stateCode)?.toLowerCase()) || ''
    ),
    stateBreakdownSizes,
    get fuse() {
      fuseInstance ??= new Fuse(entries, FUSE_OPTIONS);
      return fuseInstance;
    },
    clusters,
    clusterByMember,
    aliases,
    stateNames: new Map([...stateNames].sort(([a], [b]) => b.length - a.length)),
    stateCodes: new Set(listStateCodes(entries)),
  };
}

/** Re-rank options: score everything, gate nothing — the coverage
 * prefilter already decided what qualifies. */
const RERANK_FUSE_OPTIONS: IFuseOptions<ParameterSearchEntry> = {
  ...FUSE_OPTIONS,
  threshold: 1,
};

/** A fuzzy score (lower is better) adjusted by the path and jurisdiction priors. */
function adjustedScore(
  score: number | undefined,
  entry: ParameterSearchEntry,
  namedStates: Set<string>
): number {
  const jurisdiction = inQueryJurisdiction(entry, namedStates) ? 1 : OUT_OF_JURISDICTION_FACTOR;
  return (score ?? 0.5) * priorFactor(entry.path) * jurisdiction + priorOffset(entry.path);
}

/**
 * Weight of a candidate's coverage shortfall — the share of the query's
 * words it lacks against the best candidate — in its re-ranked score.
 * Fuzzy scoring alone reads "employer" as nearly "employee"; the word
 * match already knew better.
 */
const COVERAGE_SHORTFALL_WEIGHT = 1;

/**
 * Taken off the re-ranked score of an entry whose own label is the query,
 * word for word: "basic rate" is the parameter labelled "Basic rate"
 * before it is any of the labels that merely contain it ("Capital Gains
 * Tax basic rate"). A label that only restates its key ("capital gains"
 * on `…indices.capital_gains`) was never written as a name and earns nothing.
 */
const EXACT_LABEL_BONUS = 0.15;

/** Fuzzy-rank candidates, then adjust by the derived priors. */
function rankWithPriors(
  candidates: ParameterSearchEntry[],
  query: string,
  limit: number,
  namedStates: Set<string>,
  shortfall?: Map<ParameterSearchEntry, number>
): ParameterSearchEntry[] {
  const exact = plainWords(query);
  const ranked = new Fuse(candidates, RERANK_FUSE_OPTIONS)
    .search(query)
    .map((result) => ({
      entry: result.item,
      adjusted:
        adjustedScore(result.score, result.item, namedStates) +
        COVERAGE_SHORTFALL_WEIGHT * (shortfall?.get(result.item) ?? 0) -
        (plainWords(result.item.label) === exact && !isKeyLabel(result.item.path, result.item.label)
          ? EXACT_LABEL_BONUS
          : 0),
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
 *    (path depth, bracket internals, live usage counts, jurisdiction).
 * 3. Slow path: only when nothing matches any token (e.g. typos), fall
 *    back to full fuzzy search.
 */
export function searchParameters(
  index: ParameterSearchIndex,
  query: string,
  limit = 10,
  filters: ParameterSearchFilters = DEFAULT_SEARCH_FILTERS,
  {
    fuzzyFallback = true,
    collapseStateBreakdowns = true,
  }: { fuzzyFallback?: boolean; collapseStateBreakdowns?: boolean } = {}
): ParameterSearchEntry[] {
  const trimmed = canonicalizeQuery(query, index.aliases);
  if (trimmed.length < 2) {
    return [];
  }

  // A state the query names picks the jurisdiction. Its name matches only
  // as whole words — "montana" would otherwise credit "vermont" and
  // "montgomery" by prefix, and "kansas" credits "arkansas" by substring.
  const namedStates = statesNamedIn(query, trimmed, index);
  const stateWords = stateNameWords(trimmed, index);
  const tokens = [...new Set(trimmed.split(/\s+/).filter((token) => token.length >= 2))];

  // Token score: 1 for an exact substring hit; 0.6 when only a prefix
  // of the token (≥3 chars) appears — derived stemming, so "maximum"
  // still credits entries that say "max" without any word list.
  // A short token is a word, not a fragment: "uc" is not in "reduced",
  // nor "vat" in "private". Two letters match a whole word; three, the
  // start of one, so "tax" still finds "taxable".
  const patterns = new Map<string, RegExp>();
  const wordPattern = (token: string, whole: boolean): RegExp => {
    const key = `${whole ? 'w' : 's'}:${token}`;
    let pattern = patterns.get(key);
    if (!pattern) {
      const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      pattern = new RegExp(`(^|[^a-z0-9])${escaped}${whole ? '([^a-z0-9]|$)' : ''}`);
      patterns.set(key, pattern);
    }
    return pattern;
  };
  const tokenScore = (
    haystack: string,
    token: string,
    stateName: string,
    entry: ParameterSearchEntry
  ): number => {
    if (stateWords.has(token)) {
      return wordPattern(token, true).test(`${haystack} ${stateName}`) ? 1 : 0;
    }
    // Structural words carry little meaning ("free and reduced price
    // meals"): as a whole word they only break ties, and their absence
    // never pushes an entry below the coverage floor.
    if (INITIALISM_SKIP.has(token)) {
      return wordPattern(token, true).test(haystack) ? STRUCTURAL_WORD_SCORE : 0;
    }
    if (token.length <= 3) {
      if (!haystack.includes(token)) {
        return 0;
      }
      // A state's own code in its path is not the word: "or" in "in or
      // out of work" is not Oregon (a capitalized "OR" names it instead).
      const text =
        token === entry.stateCode
          ? `${entry.breadcrumb} ${searchLabel(entry)}`.toLowerCase()
          : haystack;
      return wordPattern(token, token.length === 2).test(text) ? 1 : 0;
    }
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
        const score = tokenScore(haystack, variant, index.stateNameTexts[i], index.entries[i]);
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
  // Best-coverage entries are collected first, and within each band the
  // query's own jurisdiction first, so the candidate cap can never crowd
  // them out — "standard deduction" alone matches thousands of state
  // parameters.
  // Across all jurisdictions, with no state asked for, a federal
  // parameter's values by state are one result — the breakdown — rather
  // than one row per state crowding out everything else.
  const collapse =
    collapseStateBreakdowns && filters.stateScope === 'all' && namedStates.size === 0;
  if (bestCoverage > 0) {
    const floor = Math.max(bestCoverage - 0.5, bestCoverage * 0.75, 0.6);
    const breakdownSeen = new Set<string>();
    // Best band in jurisdiction, best band outside, lower band in, lower band outside.
    const buckets: ParameterSearchEntry[][] = [[], [], [], []];
    const otherStates: ParameterSearchEntry[] = [];
    const shortfall = new Map<ParameterSearchEntry, number>();
    for (let i = 0; i < index.haystacks.length; i++) {
      if (coverage[i] >= floor) {
        let entry = index.entries[i];
        const breakdown = collapse
          ? breakdownMemberOf(entry.path, index.stateBreakdownSizes)?.parent
          : null;
        if (breakdown) {
          if (breakdownSeen.has(breakdown)) {
            continue;
          }
          breakdownSeen.add(breakdown);
          entry = asStateBreakdown(entry, breakdown, index.stateBreakdownSizes.get(breakdown) ?? 1);
        }
        shortfall.set(entry, (bestCoverage - coverage[i]) / groups.length);
        // Another state's parameter goes after the named state's and federal
        // ones: kept, so a near miss still shows, but never ahead of them.
        if (namedStates.size > 0 && entry.stateCode && !namedStates.has(entry.stateCode)) {
          otherStates.push(entry);
          continue;
        }
        const band = coverage[i] >= bestCoverage ? 0 : 2;
        buckets[band + (inQueryJurisdiction(entry, namedStates) ? 0 : 1)].push(entry);
      }
    }
    const candidates = buckets.flat().slice(0, RERANK_CANDIDATE_CAP);
    const ranked =
      candidates.length > 1
        ? rankWithPriors(candidates, trimmed, limit, namedStates, shortfall)
        : candidates;
    if (ranked.length >= limit || otherStates.length === 0) {
      return ranked;
    }
    const rest = otherStates.slice(0, RERANK_CANDIDATE_CAP);
    return [
      ...ranked,
      ...(rest.length > 1
        ? rankWithPriors(rest, trimmed, limit - ranked.length, namedStates, shortfall)
        : rest),
    ].slice(0, limit);
  }

  if (!fuzzyFallback) {
    return [];
  }
  return fuzzyMatches(index, trimmed, limit, namedStates)
    .filter((entry) => matchesFilters(entry, filters))
    .slice(0, limit);
}

/** A breakdown member as the result for its whole breakdown: named for the parameter, not the state. */
function asStateBreakdown(
  entry: ParameterSearchEntry,
  parent: string,
  size: number
): ParameterSearchEntry {
  // The crumbs past the parameter's are the state's key and its own breakdown.
  const keyDepth = entry.path.split('.').length - parent.split('.').length;
  const crumbs = entry.breadcrumb.split(' → ');
  const kept = crumbs.length > keyDepth ? crumbs.slice(0, crumbs.length - keyDepth) : crumbs;
  return {
    ...entry,
    breadcrumb: kept.join(' → '),
    label: kept[kept.length - 1] ?? entry.label,
    stateCode: null,
    jurisdictionCount: size,
    breakdownPath: parent,
  };
}

/**
 * Typo fallback: full fuzzy search over the whole index, ranked but not
 * yet filtered. A padded window, so filtering still leaves up to `limit`.
 * The expensive path — callers reach it only when no entry contains any
 * query word.
 */
function fuzzyMatches(
  index: ParameterSearchIndex,
  canonicalQuery: string,
  limit: number,
  namedStates: Set<string>
): ParameterSearchEntry[] {
  return index.fuse
    .search(canonicalQuery, { limit: limit * 10 })
    .map((result) => ({
      entry: result.item,
      adjusted: adjustedScore(result.score, result.item, namedStates),
    }))
    .sort((a, b) => a.adjusted - b.adjusted)
    .map((ranked) => ranked.entry);
}

export interface WidenedSearchResult {
  entries: ParameterSearchEntry[];
  /** The filters the entries satisfy — wider than asked when nothing matched. */
  filters: ParameterSearchFilters;
}

/**
 * Search, and when the filters leave nothing, search again with them
 * relaxed — the state scope first, then contributed parameters — so a
 * narrow filter shows where the matches are instead of a blank. The
 * caller compares `filters` with what it asked for to say so.
 *
 * Word matching runs for every filter set before any fuzzy matching:
 * the fuzzy pass is the slow one, so it runs once at most, and its
 * ranking is reused for each filter set.
 */
export function searchParametersWidening(
  index: ParameterSearchIndex,
  query: string,
  limit = 10,
  filters: ParameterSearchFilters = DEFAULT_SEARCH_FILTERS
): WidenedSearchResult {
  const trimmed = canonicalizeQuery(query, index.aliases);
  if (trimmed.length < 2) {
    return { entries: [], filters };
  }
  const attempts: ParameterSearchFilters[] = [filters];
  if (filters.stateScope !== 'all') {
    attempts.push({ ...filters, stateScope: 'all' });
  }
  if (!filters.includeContrib) {
    attempts.push({ stateScope: 'all', includeContrib: true });
  }
  for (const attempt of attempts) {
    const found = searchParameters(index, query, limit, attempt, { fuzzyFallback: false });
    if (found.length > 0) {
      return { entries: found, filters: attempt };
    }
  }
  const fuzzy = fuzzyMatches(index, trimmed, limit, statesNamedIn(query, trimmed, index));
  for (const attempt of attempts) {
    const kept = fuzzy.filter((entry) => matchesFilters(entry, attempt)).slice(0, limit);
    if (kept.length > 0) {
      return { entries: kept, filters: attempt };
    }
  }
  return { entries: [], filters };
}

export interface ParameterSearchGroup {
  /** Folder breadcrumb (everything above the leaf); '' when unknown */
  folder: string;
  entries: ParameterSearchEntry[];
  /**
   * For a bracket schedule's group, the schedule's path
   * (`gov.irs.credits.ctc.amount.base`): its members, every bracket, in order.
   */
  schedule?: string;
}

/** A bracket member's schedule and place: `…base[1].amount` → `…base`, 1, `amount`. */
const SCHEDULE_MEMBER = /^(.+)\[(\d+)\]\.([^.[\]]+)$/;

export function scheduleMemberOf(
  path: string
): { schedule: string; bracket: number; member: string } | null {
  const match = SCHEDULE_MEMBER.exec(path);
  return match ? { schedule: match[1], bracket: Number(match[2]), member: match[3] } : null;
}

/** Path keys that are acronyms; any other key reads as a word. */
const KEY_ACRONYMS = new Set([
  // US
  'aca',
  'actc',
  'agi',
  'arpa',
  'cdcc',
  'ctc',
  'eitc',
  'fpg',
  'obbba',
  'snap',
  'ssi',
  'tanf',
  'tcja',
  // UK
  'badr',
  'cgt',
  'dfe',
  'dwp',
  'esa',
  'hitc',
  'hmrc',
  'jsa',
  'lha',
  'ni',
  'obr',
  'ons',
  'pip',
  'uc',
  'vat',
]);

/** A path key read as a name: `arpa` → "ARPA", `base` → "Base", `joint_filers` → "Joint filers". */
function keyName(key: string): string {
  return key
    .split('_')
    .map((word, index) =>
      KEY_ACRONYMS.has(word)
        ? word.toUpperCase()
        : index === 0
          ? word.charAt(0).toUpperCase() + word.slice(1)
          : word
    )
    .join(' ');
}

/**
 * A schedule's folder: the members' breadcrumb above "Bracket N", then the
 * schedule's own name — its label ("Child Tax Credit ARPA amount"), else
 * its key ("ARPA") — since breadcrumbs skip a schedule's node, and
 * `…amount.base` and `…amount.arpa` would otherwise read alike.
 */
function scheduleFolder(entry: ParameterSearchEntry, schedule: string): string {
  const parts = entry.breadcrumb.split(' → ').slice(0, -2);
  const label = entry.scheduleLabel?.trim();
  const name = label
    ? label.charAt(0).toUpperCase() + label.slice(1)
    : keyName(schedule.split('.').pop() ?? schedule);
  if (parts[parts.length - 1]?.toLowerCase() !== name.toLowerCase()) {
    parts.push(name);
  }
  return parts.join(' → ');
}

/**
 * Organizes flat results into a hierarchy for display: parameters
 * sharing a parent folder cluster under a folder header, and groups —
 * folders and single results alike — follow the rank of their best
 * match. A bracket schedule is one group, keyed by its path — every
 * bracket together, in order, and never mixed with a sibling schedule
 * whose breadcrumb reads the same.
 */
export function groupSearchResults(results: ParameterSearchEntry[]): ParameterSearchGroup[] {
  const byKey = new Map<string, ParameterSearchGroup>();
  const order: ParameterSearchGroup[] = [];

  for (const entry of results) {
    const member = scheduleMemberOf(entry.path);
    const key = member
      ? `schedule:${member.schedule}`
      : entry.breadcrumb.split(' → ').slice(0, -1).join(' → ');
    let group = byKey.get(key);
    if (!group) {
      group = member
        ? { folder: scheduleFolder(entry, member.schedule), entries: [], schedule: member.schedule }
        : { folder: key, entries: [] };
      byKey.set(key, group);
      order.push(group);
    }
    group.entries.push(entry);
  }

  // A schedule reads bracket by bracket; its members keep their rank order within one.
  for (const group of order) {
    if (group.schedule) {
      const rank = new Map(group.entries.map((entry, index) => [entry.path, index]));
      group.entries.sort(
        (a, b) =>
          (scheduleMemberOf(a.path)?.bracket ?? 0) - (scheduleMemberOf(b.path)?.bracket ?? 0) ||
          (rank.get(a.path) ?? 0) - (rank.get(b.path) ?? 0)
      );
    }
  }

  // Groups keep the rank of their best entry: a folder of three weaker
  // matches does not jump ahead of the single best one.
  return order;
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
  const unfiltered = searchParameters(
    index,
    query,
    limit,
    { includeContrib: true, stateScope: 'all' },
    // Counted row by row, as the filtered search returns them.
    { collapseStateBreakdowns: false }
  );
  return unfiltered.filter((entry) => !matchesFilters(entry, filters)).length;
}

/**
 * Memoized selectors: entries and index are computed once per metadata
 * load and shared by every consumer (Build page now; the agent's locate
 * stage later).
 */
/**
 * Whether a reform can set this value: a number (an "Infinity" threshold
 * included) or a yes/no switch. Lists of variable names and other text
 * values are left out of what the app offers to change.
 */
export function isDraftableValue(value: unknown): boolean {
  return (
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    value === 'Infinity' ||
    value === '-Infinity'
  );
}

/** The parameters the app offers to search, browse, and change. */
export const selectParameterSearchEntries = createSelector(
  [(state: RootState) => state.metadata.parameters],
  (parameters): ParameterSearchEntry[] =>
    parameters
      ? buildParameterSearchEntries(parameters).filter((entry) =>
          isDraftableValue(getCurrentValue(parameters[entry.path]?.values))
        )
      : []
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

export const selectStateNames = createSelector(
  [(state: RootState) => state.metadata.parameters],
  (parameters): Map<string, string> =>
    parameters ? buildStateNames(parameters) : new Map<string, string>()
);

export const selectParameterSearchIndex = createSelector(
  [selectParameterSearchEntries, selectConceptClusters, selectConceptAliases, selectStateNames],
  (entries, clusters, aliases, stateNames): ParameterSearchIndex =>
    createParameterSearchIndex(entries, clusters, aliases, stateNames)
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

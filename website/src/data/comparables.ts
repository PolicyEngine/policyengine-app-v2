/**
 * Pre-publish comparables (Max, 2026-10-21).
 *
 * Before an analysis is listed on policyengine.org, every external estimate
 * of what it estimates is searched for, recorded in
 * PolicyEngine/policyengine-scorecard (docs/COMPARABLES.md there), compared
 * with the analysis's own figures, and every gap over the scorecard's
 * threshold is explained. A research entry carries a `comparables` block
 * naming that record:
 *
 *   "comparables": {
 *     "status": "reviewed",
 *     "scorecardSource": "analysis-uk-some-dashboard",
 *     "searchDate": "2026-11-02",
 *     "searchKind": "prepublish",
 *     "producersSearched": ["academic", "centax", ...],
 *     "found": 4,
 *     "searchLog": "https://github.com/PolicyEngine/policyengine-scorecard/blob/main/sources/analysis-uk-some-dashboard/search_log.json"
 *   }
 *
 * `python -m scorecard_db.comparables record <source>` in the scorecard
 * prints the block. `found` counts the comparables staged as claims; the
 * search log also lists any seen but not staged. A post that is plainly not
 * an analysis (an event, an announcement) may declare
 * `{"status": "no_estimate", "reason": "..."}` instead; an app never may.
 *
 * Which entries need a block is decided by identity, not by the date an
 * entry carries: every research entry needs one unless it is on the list of
 * entries that were live before the gate (comparablesGrandfathered.json).
 * An entry taken off the site leaves that list, so it comes back only with a
 * record. Entries may join the list only before the cutover; after it the
 * list only shrinks.
 *
 * `validateComparables` checks the block on its own (the Tests job).
 * `resolveComparables` checks it against the scorecard's published index
 * (the Comparables gate workflow, which downloads the index from the
 * scorecard's main branch), so the scorecard record merges first.
 */

import grandfatheredData from "./comparablesGrandfathered.json";
import { postSlug } from "./posts/postTransformers";

/**
 * After this day no entry may join the grandfather list. Pinned no later
 * than 2026-10-29 by the tests: Max's call (decision d1812).
 */
export const COMPARABLES_CUTOVER_DATE = "2026-10-29";

/** A search more than this many days before an entry is listed is stale. */
export const MAX_SEARCH_AGE_DAYS = 30;

const SCORECARD = "https://github.com/PolicyEngine/policyengine-scorecard";
/** The Comparables gate workflow downloads this literal; a test pins the two together. */
export const SCORECARD_INDEX_URL =
  "https://raw.githubusercontent.com/PolicyEngine/policyengine-scorecard/main/data/comparables/index.json";
export const INDEX_SCHEMA = "comparables/index/1";

/**
 * Which entries need a record, as the scorecard applies them
 * (scorecard_db/comparables.py). The index publishes its own copy under
 * `entry_rules`, and the gate checks the two agree.
 */
export const COUNTRY_TAGS = ["uk", "us", "ca", "ng", "il"] as const;
/** The website files a post with no country tag under us. */
export const DEFAULT_COUNTRY = "us";
export const ANALYSIS_TAGS = [
  "2024-election",
  "autumn-budget",
  "behavioral-responses",
  "benefit",
  "benefit-access",
  "child-tax-credit",
  "election",
  "healthcare",
  "inflation",
  "interactives",
  "policy",
  "reconciliation",
  "tariffs",
  "tax",
  "technical",
  "vat",
] as const;
export const NO_ESTIMATE_TAGS = [
  "april-fools",
  "conferences",
  "event",
  "giving",
  "org",
  "year-in-review",
] as const;
export const SEARCH_KINDS = [
  "prepublish",
  "backfill",
  "reharvest",
  "prepromotion",
] as const;

const SOURCE_PATTERN = /^analysis-(us|uk|ca|ng|il)-([a-z0-9]+(?:-[a-z0-9]+)*)$/;
const PRODUCER_PATTERN = /^[a-z0-9]+(?:_[a-z0-9]+)*$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const REGISTRY_DATE_PATTERN =
  /^(\d{4}-\d{2}-\d{2})(?: \d{2}:\d{2}(?::\d{2})?)?$/;
const MIN_REASON_LENGTH = 20;
const REVIEWED_FIELDS = [
  "status",
  "scorecardSource",
  "searchDate",
  "searchKind",
  "producersSearched",
  "found",
  "searchLog",
] as const;

export type SearchKind = (typeof SEARCH_KINDS)[number];

export interface ReviewedComparables {
  status: "reviewed";
  scorecardSource: string;
  searchDate: string;
  searchKind: SearchKind;
  producersSearched: string[];
  found: number;
  searchLog: string;
}

export interface NoEstimateComparables {
  status: "no_estimate";
  reason: string;
}

export type ComparablesRecord = ReviewedComparables | NoEstimateComparables;

/** A research listing on policyengine.org: an app shown with research or tagged policy, or a post. */
export interface ResearchEntry {
  kind: "app" | "post";
  slug: string;
  /** Countries the entry can be recorded under: an app's countryId, a post's country tags. */
  countryIds: string[];
  /**
   * The day the entry is listed, YYYY-MM-DD; the registry's own string when
   * it is not a date, and null when it has none.
   */
  date: string | null;
  tags: string[];
  comparables?: unknown;
}

export interface Grandfathered {
  snapshotDate: string;
  /** entryKey() of each research entry live before the gate. */
  entries: string[];
  /** App routes live before the gate that are not a research entry's. */
  routes: string[];
}

export const GRANDFATHERED: Grandfathered = grandfatheredData;

export interface IndexSearch {
  date: string;
  kind: string;
  producers_searched: string[];
  found: number;
}

export interface IndexEntry {
  kind: string;
  country_id: string;
  slug: string;
  searches: IndexSearch[];
  search_log: string;
}

export interface EntryRules {
  analysis_tags: string[];
  no_estimate_tags: string[];
  country_tags: string[];
  default_country: string;
  search_kinds: string[];
}

export interface ComparablesIndex {
  schema: string;
  gap_threshold: number;
  entry_rules?: EntryRules;
  analyses: Record<string, IndexEntry>;
}

interface AppLike {
  slug?: string;
  countryId?: string;
  date?: string;
  tags?: unknown;
  displayWithResearch?: boolean;
  comparables?: unknown;
}

interface PostLike {
  filename: string;
  date: string;
  tags: string[];
  comparables?: unknown;
}

export { postSlug };

function registryDate(raw: unknown): string | null {
  if (typeof raw !== "string" || raw === "") return null;
  const match = raw.match(REGISTRY_DATE_PATTERN);
  return match ? match[1] : raw;
}

function stringTags(raw: unknown): string[] {
  return Array.isArray(raw)
    ? raw.filter((tag): tag is string => typeof tag === "string")
    : [];
}

/** The entries the comparables rules cover, as the scorecard's research_entries lists them. */
export function researchEntries(
  apps: AppLike[],
  posts: PostLike[],
): ResearchEntry[] {
  const fromApps: ResearchEntry[] = apps
    .filter(
      (app) =>
        app.slug &&
        app.countryId &&
        (app.displayWithResearch || stringTags(app.tags).includes("policy")),
    )
    .map((app) => ({
      kind: "app",
      slug: app.slug as string,
      countryIds: [app.countryId as string],
      date: registryDate(app.date),
      tags: stringTags(app.tags),
      comparables: app.comparables,
    }));
  const fromPosts: ResearchEntry[] = posts.map((post) => {
    const countries = post.tags.filter((tag) =>
      (COUNTRY_TAGS as readonly string[]).includes(tag),
    );
    return {
      kind: "post",
      slug: postSlug(post.filename),
      countryIds: countries.length ? countries : [DEFAULT_COUNTRY],
      date: registryDate(post.date),
      tags: post.tags,
      comparables: post.comparables,
    };
  });
  return [...fromApps, ...fromPosts];
}

/** An entry's identity: an app by country and slug, a post by slug. */
export function entryKey(entry: ResearchEntry): string {
  return entry.kind === "app"
    ? `app ${entry.countryIds[0]}/${entry.slug}`
    : `post ${entry.slug}`;
}

export function requiresComparables(
  entry: ResearchEntry,
  grandfathered: Grandfathered = GRANDFATHERED,
): boolean {
  return !grandfathered.entries.includes(entryKey(entry));
}

/** Whether an entry may say it publishes no estimate (scorecard: may_declare_no_estimate). */
export function mayDeclareNoEstimate(entry: ResearchEntry): boolean {
  return (
    entry.kind === "post" &&
    entry.tags.some((tag) =>
      (NO_ESTIMATE_TAGS as readonly string[]).includes(tag),
    ) &&
    !entry.tags.some((tag) =>
      (ANALYSIS_TAGS as readonly string[]).includes(tag),
    )
  );
}

export function entryLabel(entry: ResearchEntry): string {
  return `${entry.kind} ${entry.countryIds.join("/")}/${entry.slug}`;
}

export function isValidDate(value: unknown): value is string {
  if (typeof value !== "string" || !DATE_PATTERN.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}

function daysBetween(earlier: string, later: string): number {
  return (
    (Date.parse(`${later}T00:00:00Z`) - Date.parse(`${earlier}T00:00:00Z`)) /
    86_400_000
  );
}

export function searchLogUrl(source: string): string {
  return `${SCORECARD}/blob/main/sources/${source}/search_log.json`;
}

const HOW_TO_FIX =
  "run the comparables review (the policyengine-comparables-review skill; docs/COMPARABLES.md in PolicyEngine/policyengine-scorecard) and paste the block `python -m scorecard_db.comparables record <source>` prints";

/**
 * Every reason an entry's comparables block is missing or malformed, read
 * on its own. A grandfathered entry needs no block, but a block it carries
 * must be well formed.
 */
export function validateComparables(
  entry: ResearchEntry,
  grandfathered: Grandfathered = GRANDFATHERED,
): string[] {
  const label = entryLabel(entry);
  const record = entry.comparables;
  const required = requiresComparables(entry, grandfathered);
  const errors: string[] = [];
  if (required && !isValidDate(entry.date)) {
    errors.push(
      `${label}: a research entry needs a publication date, YYYY-MM-DD (got ${JSON.stringify(entry.date)})`,
    );
  }
  if (record === undefined) {
    if (required) {
      errors.push(
        `${label} is not on the list of entries live before the comparables gate, so it needs a comparables block: ${HOW_TO_FIX}`,
      );
    }
    return errors;
  }
  if (typeof record !== "object" || record === null || Array.isArray(record)) {
    return [...errors, `${label}: comparables must be an object`];
  }
  const r = record as Record<string, unknown>;
  if (r.status === "no_estimate") {
    if (
      typeof r.reason !== "string" ||
      r.reason.trim().length < MIN_REASON_LENGTH
    ) {
      errors.push(
        `${label}: no_estimate needs a reason of ${MIN_REASON_LENGTH}+ characters`,
      );
    }
    if (!mayDeclareNoEstimate(entry)) {
      errors.push(
        `${label}: only a post tagged ${NO_ESTIMATE_TAGS.join(", ")} and none of ${ANALYSIS_TAGS.join(", ")} may declare no_estimate; ${HOW_TO_FIX}`,
      );
    }
    if (Object.keys(r).some((k) => k !== "status" && k !== "reason")) {
      errors.push(`${label}: no_estimate carries only status and reason`);
    }
    return errors;
  }
  if (r.status !== "reviewed") {
    return [
      ...errors,
      `${label}: comparables.status must be "reviewed" or "no_estimate"`,
    ];
  }
  for (const key of Object.keys(r)) {
    if (!(REVIEWED_FIELDS as readonly string[]).includes(key)) {
      errors.push(`${label}: unknown field ${key}`);
    }
  }
  const source = r.scorecardSource;
  if (typeof source !== "string" || !SOURCE_PATTERN.test(source)) {
    errors.push(
      `${label}: scorecardSource must be analysis-<country>-<slug>, got ${JSON.stringify(source)}`,
    );
  } else {
    const expected = entry.countryIds.map(
      (country) => `analysis-${country}-${entry.slug}`,
    );
    if (!expected.includes(source)) {
      errors.push(
        `${label}: scorecardSource ${source} does not name this entry (expected ${expected.join(" or ")})`,
      );
    }
    if (r.searchLog !== searchLogUrl(source)) {
      errors.push(`${label}: searchLog must be ${searchLogUrl(source)}`);
    }
  }
  const searchDate = r.searchDate;
  if (!isValidDate(searchDate)) {
    errors.push(`${label}: searchDate must be a real YYYY-MM-DD date`);
  }
  if (!(SEARCH_KINDS as readonly unknown[]).includes(r.searchKind)) {
    errors.push(
      `${label}: searchKind must be one of ${SEARCH_KINDS.join(", ")}`,
    );
  }
  if (required && isValidDate(searchDate) && isValidDate(entry.date)) {
    if (r.searchKind === "backfill") {
      errors.push(
        `${label}: a backfill is a search after publishing; an entry listed under the gate needs a search before it is listed`,
      );
    }
    if (searchDate > entry.date) {
      errors.push(
        `${label}: searched on ${searchDate}, after it was listed on ${entry.date}`,
      );
    } else if (daysBetween(searchDate, entry.date) > MAX_SEARCH_AGE_DAYS) {
      errors.push(
        `${label}: the search (${searchDate}) is more than ${MAX_SEARCH_AGE_DAYS} days before the listing (${entry.date}); search again`,
      );
    }
  }
  const producers = r.producersSearched;
  if (
    !Array.isArray(producers) ||
    producers.length === 0 ||
    !producers.every(
      (p) => typeof p === "string" && PRODUCER_PATTERN.test(p),
    ) ||
    new Set(producers).size !== producers.length
  ) {
    errors.push(
      `${label}: producersSearched must list each producer slug once`,
    );
  }
  if (
    typeof r.found !== "number" ||
    !Number.isInteger(r.found) ||
    r.found < 0
  ) {
    errors.push(
      `${label}: found must be a whole number (the comparables staged; 0 when none)`,
    );
  }
  return errors;
}

function sameSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sa = [...a].sort();
  const sb = [...b].sort();
  return sa.every((value, i) => value === sb[i]);
}

/** Every reason the downloaded index is not one this gate can trust. */
export function checkIndex(index: unknown): string[] {
  if (typeof index !== "object" || index === null) {
    return ["the scorecard index is not a JSON object"];
  }
  const i = index as Record<string, unknown>;
  const errors: string[] = [];
  if (i.schema !== INDEX_SCHEMA) {
    errors.push(
      `the scorecard index schema is ${JSON.stringify(i.schema)}, expected ${INDEX_SCHEMA}`,
    );
  }
  if (
    typeof i.analyses !== "object" ||
    i.analyses === null ||
    Array.isArray(i.analyses)
  ) {
    errors.push("the scorecard index has no analyses object");
  }
  const rules = i.entry_rules as EntryRules | undefined;
  if (!rules) {
    errors.push("the scorecard index publishes no entry_rules");
  } else {
    const ours: EntryRules = {
      analysis_tags: [...ANALYSIS_TAGS],
      no_estimate_tags: [...NO_ESTIMATE_TAGS],
      country_tags: [...COUNTRY_TAGS],
      default_country: DEFAULT_COUNTRY,
      search_kinds: [...SEARCH_KINDS],
    };
    for (const key of Object.keys(ours) as Array<keyof EntryRules>) {
      const theirs = rules[key];
      const same = Array.isArray(ours[key])
        ? Array.isArray(theirs) &&
          sameSet(ours[key] as string[], theirs as string[])
        : ours[key] === theirs;
      if (!same) {
        errors.push(
          `the scorecard's ${key} (${JSON.stringify(theirs)}) differs from comparables.ts (${JSON.stringify(ours[key])})`,
        );
      }
    }
  }
  return errors;
}

/**
 * Every reason a well-formed reviewed block does not resolve to a complete
 * record in the scorecard's published index. The index lists only records
 * that passed the scorecard's gate, so a match is the proof.
 */
export function resolveComparables(
  entry: ResearchEntry,
  index: ComparablesIndex,
): string[] {
  const label = entryLabel(entry);
  const record = entry.comparables as ReviewedComparables | undefined;
  if (!record || record.status !== "reviewed") return [];
  if (index.schema !== INDEX_SCHEMA) {
    return [
      `the scorecard index schema is ${index.schema}, expected ${INDEX_SCHEMA}`,
    ];
  }
  const recorded = index.analyses[record.scorecardSource];
  if (!recorded) {
    return [
      `${label}: ${record.scorecardSource} is not in the scorecard index on main; merge its scorecard PR first`,
    ];
  }
  const errors: string[] = [];
  if (recorded.kind !== entry.kind || recorded.slug !== entry.slug) {
    errors.push(
      `${label}: the scorecard records ${record.scorecardSource} as ${recorded.kind} ${recorded.slug}`,
    );
  }
  const sourceCountry = SOURCE_PATTERN.exec(record.scorecardSource)?.[1];
  if (
    recorded.country_id !== sourceCountry ||
    !entry.countryIds.includes(recorded.country_id)
  ) {
    errors.push(
      `${label}: the scorecard records ${record.scorecardSource} under ${recorded.country_id}`,
    );
  }
  if (recorded.search_log !== record.searchLog) {
    errors.push(`${label}: searchLog differs from the scorecard's`);
  }
  const sameDay = recorded.searches.filter(
    (s) => s.date === record.searchDate && s.kind === record.searchKind,
  );
  if (sameDay.length === 0) {
    errors.push(
      `${label}: the scorecard has no ${record.searchKind} search of ${record.scorecardSource} on ${record.searchDate}`,
    );
    return errors;
  }
  const matches = sameDay.some(
    (s) =>
      sameSet(s.producers_searched, record.producersSearched) &&
      s.found === record.found,
  );
  if (!matches) {
    const only = sameDay.length === 1 ? sameDay[0] : null;
    if (only && !sameSet(only.producers_searched, record.producersSearched)) {
      errors.push(
        `${label}: producersSearched differs from the scorecard's search log`,
      );
    }
    if (only && only.found !== record.found) {
      errors.push(
        `${label}: found is ${record.found}, the scorecard's search found ${only.found}`,
      );
    }
    if (!only) {
      errors.push(
        `${label}: none of the scorecard's ${record.searchKind} searches on ${record.searchDate} has these producers and this count`,
      );
    }
  }
  return errors;
}

/**
 * Every way the grandfather list has grown since `base`, which it may only
 * do before the cutover. `base` is the list on the branch a change merges
 * into; null when that branch has no list yet.
 */
export function grandfatherAdditions(
  base: Grandfathered | null,
  head: Grandfathered,
  today: string,
): string[] {
  if (!base) return [];
  const added = [
    ...head.entries.filter((key) => !base.entries.includes(key)),
    ...head.routes.filter((route) => !base.routes.includes(route)),
  ];
  if (today < COMPARABLES_CUTOVER_DATE || added.length === 0) return [];
  return [
    `the comparables grandfather list only shrinks after ${COMPARABLES_CUTOVER_DATE}, but this change adds ${added.join(", ")}: give each a comparables block instead`,
  ];
}

/** An app route's path as an entry's (/uk/slug), or null for another shape. */
export function routeEntryKey(route: string): string | null {
  const match = route.match(/^\/(us|uk|ca|ng|il)\/([a-z0-9]+(?:-[a-z0-9]+)*)$/);
  return match ? `app ${match[1]}/${match[2]}` : null;
}

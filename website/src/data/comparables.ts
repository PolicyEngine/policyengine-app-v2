/**
 * Pre-publish comparables (Max, 2026-10-21).
 *
 * Before an analysis is listed on policyengine.org, every external estimate
 * of what it estimates is searched for, recorded in
 * PolicyEngine/policyengine-scorecard (docs/COMPARABLES.md there), compared
 * with the analysis's own figures, and every gap over the scorecard's
 * threshold is explained. A research entry dated on or after the cutover
 * carries a `comparables` block naming that record:
 *
 *   "comparables": {
 *     "status": "reviewed",
 *     "scorecardSource": "analysis-uk-childcare-100k-threshold",
 *     "searchDate": "2026-10-21",
 *     "searchKind": "prepublish",
 *     "producersSearched": ["academic", "centax", ...],
 *     "found": 20,
 *     "searchLog": "https://github.com/PolicyEngine/policyengine-scorecard/blob/main/sources/analysis-uk-childcare-100k-threshold/search_log.json"
 *   }
 *
 * `python -m scorecard_db.comparables record <source>` in the scorecard
 * prints the block. An entry that publishes no estimate declares
 * `{"status": "no_estimate", "reason": "..."}` instead, which an entry
 * tagged `policy` cannot.
 *
 * `validateComparables` checks the block on its own (the Tests job).
 * `resolveComparables` checks it against the scorecard's published index
 * (the Comparables gate workflow, which downloads the index from the
 * scorecard's main branch), so the scorecard record merges first.
 */

/** Research entries dated on or after this day need a comparables block. */
export const COMPARABLES_CUTOVER_DATE = "2026-10-29";

/** A pre-publish search older than this many days before publishing is stale. */
export const MAX_SEARCH_AGE_DAYS = 30;

const SCORECARD = "https://github.com/PolicyEngine/policyengine-scorecard";
export const SCORECARD_INDEX_URL =
  "https://raw.githubusercontent.com/PolicyEngine/policyengine-scorecard/main/data/comparables/index.json";
export const INDEX_SCHEMA = "comparables/index/1";

const COUNTRY_TAGS = ["us", "uk", "ca", "ng", "il"] as const;
const SOURCE_PATTERN = /^analysis-(us|uk|ca|ng|il)-[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PRODUCER_PATTERN = /^[a-z0-9]+(?:_[a-z0-9]+)*$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MIN_REASON_LENGTH = 20;

export interface ReviewedComparables {
  status: "reviewed";
  scorecardSource: string;
  searchDate: string;
  searchKind: "prepublish" | "backfill";
  producersSearched: string[];
  found: number;
  searchLog: string;
}

export interface NoEstimateComparables {
  status: "no_estimate";
  reason: string;
}

export type ComparablesRecord = ReviewedComparables | NoEstimateComparables;

/** A research listing on policyengine.org: an app shown with research, or a post. */
export interface ResearchEntry {
  kind: "app" | "post";
  slug: string;
  /** Countries the entry can be recorded under: an app's countryId, a post's country tags. */
  countryIds: string[];
  /** YYYY-MM-DD, the day the entry is published. */
  date: string;
  tags: string[];
  comparables?: unknown;
}

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

export interface ComparablesIndex {
  schema: string;
  gap_threshold: number;
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

/** The website's post slug (postTransformers.ts). */
export function postSlug(filename: string): string {
  const stem = filename.includes(".")
    ? filename.substring(0, filename.indexOf("."))
    : filename;
  return stem.toLowerCase().replace(/_/g, "-");
}

export function researchEntries(
  apps: AppLike[],
  posts: PostLike[],
): ResearchEntry[] {
  const fromApps: ResearchEntry[] = apps
    .filter((app) => app.displayWithResearch && app.date && app.slug)
    .map((app) => ({
      kind: "app",
      slug: app.slug as string,
      countryIds: app.countryId ? [app.countryId] : [],
      date: (app.date as string).slice(0, 10),
      tags: Array.isArray(app.tags) ? (app.tags as string[]) : [],
      comparables: app.comparables,
    }));
  const fromPosts: ResearchEntry[] = posts.map((post) => ({
    kind: "post",
    slug: postSlug(post.filename),
    countryIds: post.tags.filter((tag) =>
      (COUNTRY_TAGS as readonly string[]).includes(tag),
    ),
    date: post.date.slice(0, 10),
    tags: post.tags,
    comparables: post.comparables,
  }));
  return [...fromApps, ...fromPosts];
}

export function requiresComparables(entry: ResearchEntry): boolean {
  return entry.date >= COMPARABLES_CUTOVER_DATE;
}

export function entryLabel(entry: ResearchEntry): string {
  return `${entry.kind} ${entry.countryIds.join("/") || "-"}/${entry.slug}`;
}

function isValidDate(value: unknown): value is string {
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

/**
 * Every reason an entry's comparables block is missing or malformed, read
 * on its own. Entries before the cutover need no block, but a block they
 * carry must be well formed.
 */
export function validateComparables(entry: ResearchEntry): string[] {
  const label = entryLabel(entry);
  const record = entry.comparables;
  const required = requiresComparables(entry);
  if (record === undefined) {
    return required
      ? [
          `${label} (${entry.date}) is on or after the ${COMPARABLES_CUTOVER_DATE} cutover and has no comparables block: run the comparables review (policyengine-comparables-review)`,
        ]
      : [];
  }
  if (typeof record !== "object" || record === null) {
    return [`${label}: comparables must be an object`];
  }
  const r = record as Record<string, unknown>;
  if (r.status === "no_estimate") {
    const errors: string[] = [];
    if (
      typeof r.reason !== "string" ||
      r.reason.trim().length < MIN_REASON_LENGTH
    ) {
      errors.push(
        `${label}: no_estimate needs a reason of ${MIN_REASON_LENGTH}+ characters`,
      );
    }
    if (entry.tags.includes("policy")) {
      errors.push(
        `${label}: a policy entry publishes an estimate, so it cannot be no_estimate`,
      );
    }
    if (Object.keys(r).some((k) => k !== "status" && k !== "reason")) {
      errors.push(`${label}: no_estimate carries only status and reason`);
    }
    return errors;
  }
  if (r.status !== "reviewed") {
    return [`${label}: comparables.status must be "reviewed" or "no_estimate"`];
  }
  const errors: string[] = [];
  const allowed = new Set([
    "status",
    "scorecardSource",
    "searchDate",
    "searchKind",
    "producersSearched",
    "found",
    "searchLog",
  ]);
  for (const key of Object.keys(r)) {
    if (!allowed.has(key)) errors.push(`${label}: unknown field ${key}`);
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
        `${label}: scorecardSource ${source} does not name this entry (expected ${expected.join(" or ") || "a country tag"})`,
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
  if (r.searchKind !== "prepublish" && r.searchKind !== "backfill") {
    errors.push(`${label}: searchKind must be prepublish or backfill`);
  }
  if (required && isValidDate(searchDate)) {
    if (r.searchKind !== "prepublish") {
      errors.push(
        `${label}: an entry published after the cutover needs a prepublish search`,
      );
    }
    if (searchDate > entry.date) {
      errors.push(
        `${label}: searched on ${searchDate}, after it was published on ${entry.date}`,
      );
    } else if (daysBetween(searchDate, entry.date) > MAX_SEARCH_AGE_DAYS) {
      errors.push(
        `${label}: the search (${searchDate}) is more than ${MAX_SEARCH_AGE_DAYS} days before publication (${entry.date}); search again`,
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
    errors.push(`${label}: found must be a whole number (0 when none found)`);
  }
  return errors;
}

function sameSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sa = [...a].sort();
  const sb = [...b].sort();
  return sa.every((value, i) => value === sb[i]);
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
  if (!entry.countryIds.includes(recorded.country_id)) {
    errors.push(
      `${label}: the scorecard records ${record.scorecardSource} under ${recorded.country_id}`,
    );
  }
  if (recorded.search_log !== record.searchLog) {
    errors.push(`${label}: searchLog differs from the scorecard's`);
  }
  const search = recorded.searches.find(
    (s) => s.date === record.searchDate && s.kind === record.searchKind,
  );
  if (!search) {
    errors.push(
      `${label}: the scorecard has no ${record.searchKind} search of ${record.scorecardSource} on ${record.searchDate}`,
    );
    return errors;
  }
  if (!sameSet(search.producers_searched, record.producersSearched)) {
    errors.push(
      `${label}: producersSearched differs from the scorecard's search log`,
    );
  }
  if (search.found !== record.found) {
    errors.push(
      `${label}: found is ${record.found}, the scorecard's search found ${search.found}`,
    );
  }
  return errors;
}

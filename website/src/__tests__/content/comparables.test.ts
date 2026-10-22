// @vitest-environment node
import { readFileSync } from "node:fs";
import fc from "fast-check";
import { describe, expect, test } from "vitest";
import {
  ANALYSIS_TAGS,
  bannerHrefs,
  changedEntries,
  checkIndex,
  COMPARABLES_CUTOVER_DATE,
  COUNTRY_TAGS,
  type ComparablesIndex,
  DEFAULT_COUNTRY,
  entryKey,
  freshness,
  type Grandfathered,
  grandfatherAdditions,
  INDEX_SCHEMA,
  MAX_SEARCH_AGE_DAYS,
  mayDeclareNoEstimate,
  NO_ESTIMATE_TAGS,
  postSlug,
  promotionProblems,
  publicationProblems,
  requiresComparables,
  type ResearchEntry,
  resolveComparables,
  type ReviewedComparables,
  researchEntries,
  routeEntryKey,
  SEARCH_KINDS,
  searchLogUrl,
  validateComparables,
} from "@/data/comparables";

// Properties of the comparables gate (website/src/data/comparables.ts):
// - an entry off the grandfather list with a well-formed block whose search
//   the scorecard index lists always resolves;
// - any one disagreement between the block and the index fails resolution;
// - any one malformation of a well-formed block fails validation;
// - an entry off the grandfather list needs a block whatever date it
//   carries, and one on the list never does;
// - only a post that is plainly not an analysis may declare no_estimate;
// - researchEntries lists apps by the research or policy flag and every
//   post, with the site's slugs, dates and countries;
// - the grandfather list may grow only before the cutover.

const DAY = 86_400_000;

function addDays(date: string, days: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY)
    .toISOString()
    .slice(0, 10);
}

const NONE: Grandfathered = {
  snapshotDate: "2026-10-22",
  entries: [],
  routes: [],
};

const slugArb = fc
  .array(fc.stringMatching(/^[a-z0-9]{1,8}$/), { minLength: 1, maxLength: 4 })
  .map((parts) => parts.join("-"));
const producerArb = fc.stringMatching(/^[a-z]{2,8}(_[a-z]{2,6})?$/);
const producersArb = fc.uniqueArray(producerArb, {
  minLength: 1,
  maxLength: 20,
});
const countryArb = fc.constantFrom(...COUNTRY_TAGS);
const kindArb = fc.constantFrom<"app" | "post">("app", "post");
// days from the cutover the entry is listed (backdated ones too), and days
// before that it was searched
const listedArb = fc.integer({ min: -900, max: 900 });
const searchLeadArb = fc.integer({ min: 0, max: MAX_SEARCH_AGE_DAYS });
const listedKindArb = fc.constantFrom<ReviewedComparables["searchKind"]>(
  "prepublish",
  "reharvest",
  "prepromotion",
);

interface Case {
  entry: ResearchEntry;
  record: ReviewedComparables;
  index: ComparablesIndex;
}

function entryRules() {
  return {
    analysis_tags: [...ANALYSIS_TAGS],
    no_estimate_tags: [...NO_ESTIMATE_TAGS],
    country_tags: [...COUNTRY_TAGS],
    default_country: DEFAULT_COUNTRY,
    search_kinds: [...SEARCH_KINDS],
  };
}

const caseArb: fc.Arbitrary<Case> = fc
  .record({
    slug: slugArb,
    country: countryArb,
    kind: kindArb,
    listed: listedArb,
    lead: searchLeadArb,
    searchKind: listedKindArb,
    producers: producersArb,
    found: fc.nat({ max: 60 }),
    otherSearches: fc.nat({ max: 3 }),
  })
  .map(
    ({
      slug,
      country,
      kind,
      listed,
      lead,
      searchKind,
      producers,
      found,
      otherSearches,
    }) => {
      const date = addDays(COMPARABLES_CUTOVER_DATE, listed);
      const searchDate = addDays(date, -lead);
      const source = `analysis-${country}-${slug}`;
      const record: ReviewedComparables = {
        status: "reviewed",
        scorecardSource: source,
        searchDate,
        searchKind,
        producersSearched: producers,
        found,
        searchLog: searchLogUrl(source),
      };
      const entry: ResearchEntry = {
        kind,
        slug,
        countryIds: [country],
        date,
        tags: [country, "policy"],
        comparables: record,
      };
      // the index lists producers sorted, and later re-harvests besides
      const searches = [
        {
          date: searchDate,
          kind: searchKind,
          producers_searched: [...producers].sort(),
          found,
        },
        ...Array.from({ length: otherSearches }, (_, i) => ({
          date: addDays(date, 7 * (i + 1)),
          kind: "reharvest",
          producers_searched: [...producers].sort(),
          found: i,
        })),
      ];
      const index: ComparablesIndex = {
        schema: INDEX_SCHEMA,
        gap_threshold: 0.25,
        entry_rules: entryRules(),
        analyses: {
          [source]: {
            kind,
            country_id: country,
            slug,
            searches,
            search_log: searchLogUrl(source),
          },
        },
      };
      return { entry, record, index };
    },
  );

function withBlock(entry: ResearchEntry, block: unknown): ResearchEntry {
  return { ...entry, comparables: block };
}

describe("comparables gate properties", () => {
  test("every well-formed entry off the grandfather list resolves against an index that lists its search", () => {
    fc.assert(
      fc.property(caseArb, ({ entry, index }) => {
        expect(requiresComparables(entry, NONE)).toBe(true);
        expect(validateComparables(entry, NONE)).toEqual([]);
        expect(checkIndex(index)).toEqual([]);
        expect(resolveComparables(entry, index)).toEqual([]);
      }),
    );
  });

  test("any one disagreement with the index fails resolution", () => {
    const at = (c: Case) => c.index.analyses[c.record.scorecardSource];
    const mutations: Array<(c: Case) => void> = [
      (c) => {
        c.index.analyses = {};
      },
      (c) => {
        at(c).searches[0].found += 1;
      },
      (c) => {
        at(c).searches[0].producers_searched.pop();
      },
      (c) => {
        at(c).searches[0].producers_searched.push("zzz_extra");
      },
      (c) => {
        at(c).searches[0].date = addDays(c.record.searchDate, -1);
      },
      (c) => {
        at(c).searches[0].kind = "backfill";
      },
      (c) => {
        at(c).slug += "-x";
      },
      (c) => {
        at(c).country_id = c.entry.countryIds[0] === "uk" ? "us" : "uk";
      },
      (c) => {
        at(c).kind = c.entry.kind === "app" ? "post" : "app";
      },
      (c) => {
        at(c).search_log += "#other";
      },
      (c) => {
        c.index.schema = "comparables/index/0";
      },
    ];
    fc.assert(
      fc.property(
        caseArb,
        fc.integer({ min: 0, max: mutations.length - 1 }),
        (c, which) => {
          mutations[which](c);
          expect(resolveComparables(c.entry, c.index)).not.toEqual([]);
        },
      ),
    );
  });

  test("any one malformation of a well-formed block fails validation", () => {
    const malformations: Array<
      (r: Record<string, unknown>, e: ResearchEntry) => unknown
    > = [
      (r) => ({ ...r, extra: 1 }),
      (r) => ({ ...r, searchLog: `${r.searchLog}x` }),
      (r) => ({ ...r, scorecardSource: "Analysis-UK-x" }),
      (r, e) => {
        const source = `analysis-${e.countryIds[0]}-${e.slug}-other`;
        return {
          ...r,
          scorecardSource: source,
          searchLog: searchLogUrl(source),
        };
      },
      (r) => ({ ...r, searchDate: "2026-02-30" }),
      (r) => ({ ...r, searchDate: "02/11/2026" }),
      (r) => ({ ...r, searchKind: "later" }),
      (r) => ({ ...r, searchKind: "backfill" }),
      (r, e) => ({ ...r, searchDate: addDays(e.date as string, 1) }),
      (r, e) => ({
        ...r,
        searchDate: addDays(e.date as string, -(MAX_SEARCH_AGE_DAYS + 1)),
      }),
      (r) => ({ ...r, producersSearched: [] }),
      (r) => ({ ...r, producersSearched: "obr" }),
      (r) => ({
        ...r,
        producersSearched: [
          ...(r.producersSearched as string[]),
          (r.producersSearched as string[])[0],
        ],
      }),
      (r) => ({ ...r, producersSearched: ["Not A Slug"] }),
      (r) => ({ ...r, found: 1.5 }),
      (r) => ({ ...r, found: -1 }),
      (r) => ({ ...r, found: "3" }),
      (r) => ({ ...r, status: "searched" }),
      () => "reviewed",
      () => null,
      (r) => [r],
    ];
    fc.assert(
      fc.property(
        caseArb,
        fc.integer({ min: 0, max: malformations.length - 1 }),
        ({ entry, record }, which) => {
          const broken = withBlock(
            entry,
            malformations[which]({ ...record }, entry),
          );
          expect(validateComparables(broken, NONE)).not.toEqual([]);
        },
      ),
    );
  });

  test("an entry off the grandfather list needs a block, whatever date it carries", () => {
    fc.assert(
      fc.property(caseArb, ({ entry }) => {
        const bare = withBlock(entry, undefined);
        expect(validateComparables(bare, NONE).join()).toMatch(
          /needs a comparables block/,
        );
      }),
    );
  });

  test("an entry off the grandfather list needs a real listing date", () => {
    fc.assert(
      fc.property(
        caseArb,
        fc.constantFrom(null, "", "03/11/2026", "2026-13-01"),
        ({ entry }, date) => {
          expect(validateComparables({ ...entry, date }, NONE).join()).toMatch(
            /needs a publication date/,
          );
        },
      ),
    );
  });

  test("an entry on the grandfather list needs no block, but a block it carries must be well formed", () => {
    fc.assert(
      fc.property(caseArb, ({ entry, record }) => {
        const listed: Grandfathered = { ...NONE, entries: [entryKey(entry)] };
        expect(requiresComparables(entry, listed)).toBe(false);
        expect(
          validateComparables(withBlock(entry, undefined), listed),
        ).toEqual([]);
        // a backfill is fine for an entry that was live before the gate
        expect(
          validateComparables(
            withBlock(entry, { ...record, searchKind: "backfill" }),
            listed,
          ),
        ).toEqual([]);
        expect(
          validateComparables(
            withBlock(entry, { ...record, found: -1 }),
            listed,
          ),
        ).not.toEqual([]);
      }),
    );
  });

  test("only a post that is plainly not an analysis may declare no estimate", () => {
    const tagArb = fc.uniqueArray(
      fc.constantFrom(
        ...ANALYSIS_TAGS,
        ...NO_ESTIMATE_TAGS,
        "featured",
        "impact",
        "uk",
        "us",
      ),
      { maxLength: 5 },
    );
    fc.assert(
      fc.property(caseArb, tagArb, ({ entry }, tags) => {
        const declared = {
          ...entry,
          tags,
          comparables: {
            status: "no_estimate",
            reason: "An event write-up with no estimate in it.",
          },
        };
        const allowed =
          entry.kind === "post" &&
          tags.some((t) =>
            (NO_ESTIMATE_TAGS as readonly string[]).includes(t),
          ) &&
          !tags.some((t) => (ANALYSIS_TAGS as readonly string[]).includes(t));
        expect(mayDeclareNoEstimate(declared)).toBe(allowed);
        expect(validateComparables(declared, NONE).length === 0).toBe(allowed);
      }),
    );
  });

  test("a no_estimate block needs a reason and nothing else", () => {
    const post: ResearchEntry = {
      kind: "post",
      slug: "an-event",
      countryIds: ["uk"],
      date: "2026-11-02",
      tags: ["uk", "event"],
    };
    const reason = "An event write-up with no estimate in it.";
    expect(
      validateComparables(
        withBlock(post, { status: "no_estimate", reason }),
        NONE,
      ),
    ).toEqual([]);
    expect(
      validateComparables(
        withBlock(post, { status: "no_estimate", reason: "none" }),
        NONE,
      ).join(),
    ).toMatch(/reason of 20\+/);
    expect(
      validateComparables(
        withBlock(post, { status: "no_estimate", reason, found: 0 }),
        NONE,
      ).join(),
    ).toMatch(/only status and reason/);
  });
});

describe("the scorecard index", () => {
  test("an index of another shape, or with other entry rules, is refused", () => {
    const good = {
      schema: INDEX_SCHEMA,
      gap_threshold: 0.25,
      entry_rules: entryRules(),
      analyses: {},
    };
    expect(checkIndex(good)).toEqual([]);
    expect(checkIndex({ ...good, schema: "not-an-index" })).not.toEqual([]);
    expect(checkIndex({ ...good, analyses: [] })).not.toEqual([]);
    expect(checkIndex({ ...good, entry_rules: undefined })).not.toEqual([]);
    expect(
      checkIndex({
        ...good,
        entry_rules: { ...entryRules(), analysis_tags: ["policy"] },
      }).join(),
    ).toMatch(/analysis_tags/);
    expect(
      checkIndex({
        ...good,
        entry_rules: { ...entryRules(), default_country: "uk" },
      }).join(),
    ).toMatch(/default_country/);
    expect(checkIndex(null)).not.toEqual([]);
  });

  test("a block matches any one of two searches on the same day", () => {
    fc.assert(
      fc.property(caseArb, fc.nat({ max: 60 }), (c, otherFound) => {
        fc.pre(otherFound !== c.record.found);
        const searches = c.index.analyses[c.record.scorecardSource].searches;
        searches.unshift({ ...searches[0], found: otherFound });
        expect(resolveComparables(c.entry, c.index)).toEqual([]);
      }),
    );
  });

  test("a record filed under another country than its name fails", () => {
    fc.assert(
      fc.property(caseArb, ({ entry, index, record }) => {
        const other = entry.countryIds[0] === "uk" ? "us" : "uk";
        index.analyses[record.scorecardSource].country_id = other;
        const both = { ...entry, countryIds: [entry.countryIds[0], other] };
        expect(resolveComparables(both, index).join()).toMatch(/under/);
      }),
    );
  });
});

describe("research entries", () => {
  const appArb = fc.record({
    slug: slugArb,
    countryId: countryArb,
    date: fc.option(
      fc
        .tuple(
          fc.integer({ min: -400, max: 400 }),
          fc.constantFrom("", " 12:00:00", " 09:30"),
        )
        .map(([d, time]) => `${addDays(COMPARABLES_CUTOVER_DATE, d)}${time}`),
      { nil: undefined },
    ),
    tags: fc.uniqueArray(
      fc.constantFrom("policy", "featured", "interactives", "tax", "uk", "us"),
      { maxLength: 4 },
    ),
    displayWithResearch: fc.option(fc.boolean(), { nil: undefined }),
  });
  const postArb = fc.record({
    filename: fc
      .tuple(
        fc.stringMatching(/^[A-Za-z0-9]{1,6}(?:[_-][A-Za-z0-9]{1,6}){0,3}$/),
        fc.constantFrom(".md", ".ipynb", ".v2.md"),
      )
      .map(([stem, ext]) => `${stem}${ext}`),
    date: fc
      .tuple(
        fc.integer({ min: -400, max: 400 }),
        fc.constantFrom("", " 12:00:00"),
      )
      .map(([d, time]) => `${addDays(COMPARABLES_CUTOVER_DATE, d)}${time}`),
    tags: fc.uniqueArray(
      fc.constantFrom(...COUNTRY_TAGS, "global", "policy", "org", "event"),
      { maxLength: 4 },
    ),
  });

  test("apps are listed when shown with research or tagged policy; every post is", () => {
    fc.assert(
      fc.property(
        fc.array(appArb, { maxLength: 6 }),
        fc.array(postArb, { maxLength: 6 }),
        (apps, posts) => {
          const entries = researchEntries(apps, posts);
          const listedApps = apps.filter(
            (a) => a.displayWithResearch || a.tags.includes("policy"),
          );
          expect(entries.filter((e) => e.kind === "app")).toHaveLength(
            listedApps.length,
          );
          expect(entries.filter((e) => e.kind === "post")).toHaveLength(
            posts.length,
          );
          for (const [entry, app] of entries
            .filter((e) => e.kind === "app")
            .map((e, i) => [e, listedApps[i]] as const)) {
            expect(entry.countryIds).toEqual([app.countryId]);
            expect(entry.date).toBe(app.date ? app.date.slice(0, 10) : null);
            expect(entryKey(entry)).toBe(`app ${app.countryId}/${app.slug}`);
          }
          for (const [entry, post] of entries
            .filter((e) => e.kind === "post")
            .map((e, i) => [e, posts[i]] as const)) {
            const countries = post.tags.filter((t) =>
              (COUNTRY_TAGS as readonly string[]).includes(t),
            );
            expect(entry.countryIds).toEqual(
              countries.length ? countries : [DEFAULT_COUNTRY],
            );
            expect(entry.date).toBe(post.date.slice(0, 10));
            expect(entry.slug).toBe(postSlug(post.filename));
            expect(entry.slug).toMatch(/^[a-z0-9-]+$/);
            expect(entry.slug).not.toMatch(/\./);
          }
        },
      ),
    );
  });

  test("a registry date that is not one stays as written, so the gate can refuse it", () => {
    const [entry] = researchEntries(
      [],
      [{ filename: "a.md", date: "03/11/2026", tags: ["uk"] }],
    );
    expect(entry.date).toBe("03/11/2026");
    expect(validateComparables(entry, NONE).join()).toMatch(
      /needs a publication date/,
    );
  });

  test("an app route names its entry", () => {
    expect(routeEntryKey("/uk/triple-lock")).toBe("app uk/triple-lock");
    expect(routeEntryKey("/:countryId/bill-tracker")).toBeNull();
    expect(routeEntryKey("/ai-beliefs")).toBeNull();
    expect(routeEntryKey("/uk/research/some-post")).toBeNull();
  });
});

describe("the grandfather list", () => {
  const base: Grandfathered = {
    snapshotDate: "2026-10-22",
    entries: ["app uk/a", "post b"],
    routes: ["/x"],
  };
  const dayArb = fc
    .integer({ min: -60, max: 400 })
    .map((d) => addDays(COMPARABLES_CUTOVER_DATE, d));

  test("it may grow before the cutover and only shrink after", () => {
    fc.assert(
      fc.property(
        dayArb,
        fc.subarray(base.entries),
        fc.subarray(["app us/new", "post newer"]),
        fc.boolean(),
        (today, kept, added, addRoute) => {
          const head: Grandfathered = {
            ...base,
            entries: [...kept, ...added],
            routes: addRoute ? [...base.routes, "/y"] : base.routes,
          };
          const grew = added.length > 0 || addRoute;
          const errors = grandfatherAdditions(base, head, today);
          expect(errors.length > 0).toBe(
            grew && today >= COMPARABLES_CUTOVER_DATE,
          );
        },
      ),
    );
  });

  test("a branch with no list yet starts one", () => {
    expect(grandfatherAdditions(null, base, "2027-01-01")).toEqual([]);
  });
});

describe("listing and promotion on the day a change is checked", () => {
  const PIN = "PolicyEngine/x@" + "b".repeat(40) + ":" + "a".repeat(64);
  const TODAY = "2026-11-10";
  const source = "analysis-uk-x";
  const block: ReviewedComparables = {
    status: "reviewed",
    scorecardSource: source,
    searchDate: "2026-11-02",
    searchKind: "reharvest",
    producersSearched: ["obr"],
    found: 0,
    searchLog: searchLogUrl(source),
  };
  const entry: ResearchEntry = {
    kind: "app",
    slug: "x",
    countryIds: ["uk"],
    date: "2026-11-10",
    tags: ["uk", "policy"],
    comparables: block,
  };
  const record = (
    over: Partial<ComparablesIndex["analyses"][string]> = {},
  ) => ({
    kind: "app",
    country_id: "uk",
    slug: "x",
    search_log: searchLogUrl(source),
    current_pins: [PIN],
    searches: [
      {
        date: "2026-11-02",
        kind: "reharvest",
        producers_searched: ["obr"],
        found: 0,
        results_pins: [PIN],
      },
    ],
    comparisons: [] as Array<{
      claim: string;
      status: string;
      found_on?: string;
    }>,
    ...over,
  });
  const index = (over = {}): ComparablesIndex => ({
    schema: INDEX_SCHEMA,
    gap_threshold: 0.25,
    promotion_window_days: 7,
    entry_rules: entryRules(),
    analyses: { [source]: record(over) },
  });

  test("a re-listing with a gap still pending is refused", () => {
    expect(publicationProblems(entry, index(), TODAY)).toEqual([]);
    const pending = index({
      comparisons: [
        { claim: "centax_static", status: "pending", found_on: "2026-11-02" },
      ],
    });
    expect(resolveComparables(entry, pending)).toEqual([]);
    expect(publicationProblems(entry, pending, TODAY).join()).toMatch(
      /gaps still pending/,
    );
    // a pending gap with no date counts as found
    const undated = index({ comparisons: [{ claim: "c", status: "pending" }] });
    expect(publicationProblems(entry, undated, TODAY)).not.toEqual([]);
  });

  test("the search's age is judged on the day the change lists the entry, not the date it carries", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 400 }), (lag) => {
        const today = addDays("2026-11-02", lag);
        const problems = publicationProblems(entry, index(), today);
        expect(problems.some((p) => /more than 30 days/.test(p))).toBe(
          lag > MAX_SEARCH_AGE_DAYS,
        );
      }),
    );
  });

  test("a search against old results does not list the entry", () => {
    const moved = index({ current_pins: [PIN.replace("b", "c")] });
    expect(publicationProblems(entry, moved, TODAY).join()).toMatch(
      /did not compare the results/,
    );
  });

  test("only new, re-dated or re-blocked entries are judged as listed by the change", () => {
    const base = [entry, { ...entry, slug: "y", comparables: undefined }];
    const head = [
      entry,
      { ...entry, slug: "y", comparables: undefined },
      { ...entry, slug: "z" },
    ];
    expect(changedEntries(base, head).map((e) => e.slug)).toEqual(["z"]);
    expect(
      changedEntries(base, [{ ...entry, date: "2026-11-11" }]).map(
        (e) => e.slug,
      ),
    ).toEqual(["x"]);
    expect(
      changedEntries(base, [{ ...entry, comparables: { ...block, found: 1 } }]),
    ).toHaveLength(1);
  });

  test("a newly featured card needs a fresh search, grandfathered entries included", () => {
    const grandfathered: ResearchEntry = {
      ...entry,
      slug: "free-childcare-reform",
      comparables: undefined,
    };
    expect(
      promotionProblems(
        ["/uk/free-childcare-reform"],
        [grandfathered],
        index(),
        TODAY,
      ).join(),
    ).toMatch(/has no comparables record/);
    // the window counts back seven days from the push, both ends included
    expect(
      promotionProblems(["/uk/x"], [entry], index(), "2026-11-09"),
    ).toEqual([]);
    expect(
      promotionProblems(["/uk/x"], [entry], index(), "2026-12-01").join(),
    ).toMatch(/no comparables search between/);
    expect(
      promotionProblems(["/uk/nowhere"], [entry], index(), TODAY).join(),
    ).toMatch(/links no research entry/);
  });

  test("banner hrefs are read in any quote style", () => {
    expect(
      bannerHrefs(`{ href: "/uk/a" }, { href: '/uk/b' }, { href: \`/uk/c\` }`),
    ).toEqual(["/uk/a", "/uk/b", "/uk/c"]);
  });

  test("freshness agrees with the scorecard's on its shared cases", () => {
    const cases = JSON.parse(
      readFileSync(
        new URL("./fixtures/comparables_fresh_cases.json", import.meta.url),
        "utf8",
      ),
    ) as Array<{ entry: never; on: string; window: number; fresh: boolean }>;
    expect(cases.length).toBeGreaterThan(50);
    for (const c of cases) {
      expect(freshness(c.entry, c.on, c.window).length === 0).toBe(c.fresh);
    }
  });
});

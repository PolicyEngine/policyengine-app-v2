import fc from "fast-check";
import { describe, expect, test } from "vitest";
import {
  COMPARABLES_CUTOVER_DATE,
  type ComparablesIndex,
  INDEX_SCHEMA,
  MAX_SEARCH_AGE_DAYS,
  postSlug,
  requiresComparables,
  type ResearchEntry,
  resolveComparables,
  type ReviewedComparables,
  researchEntries,
  searchLogUrl,
  validateComparables,
} from "@/data/comparables";

// Properties of the comparables gate (website/src/data/comparables.ts):
// - an entry after the cutover with a well-formed block whose search the
//   scorecard index lists always resolves;
// - any one disagreement between the block and the index fails resolution;
// - an entry after the cutover without a block, with a stale or late search,
//   or a policy entry declared no_estimate, always fails validation;
// - entries before the cutover never need a block.

const DAY = 86_400_000;

function addDays(date: string, days: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY)
    .toISOString()
    .slice(0, 10);
}

const slugArb = fc
  .array(fc.stringMatching(/^[a-z0-9]{1,8}$/), { minLength: 1, maxLength: 4 })
  .map((parts) => parts.join("-"));
const producerArb = fc.stringMatching(/^[a-z]{2,8}(_[a-z]{2,6})?$/);
const producersArb = fc.uniqueArray(producerArb, {
  minLength: 1,
  maxLength: 20,
});
const countryArb = fc.constantFrom("uk", "us");
const kindArb = fc.constantFrom<"app" | "post">("app", "post");
// days after the cutover the entry is published, and days before that it was searched
const afterCutoverArb = fc.integer({ min: 0, max: 900 });
const searchLeadArb = fc.integer({ min: 0, max: MAX_SEARCH_AGE_DAYS });

interface Case {
  entry: ResearchEntry;
  record: ReviewedComparables;
  index: ComparablesIndex;
}

const caseArb: fc.Arbitrary<Case> = fc
  .record({
    slug: slugArb,
    country: countryArb,
    kind: kindArb,
    after: afterCutoverArb,
    lead: searchLeadArb,
    producers: producersArb,
    found: fc.nat({ max: 60 }),
    otherSearches: fc.nat({ max: 3 }),
  })
  .map(
    ({ slug, country, kind, after, lead, producers, found, otherSearches }) => {
      const date = addDays(COMPARABLES_CUTOVER_DATE, after);
      const searchDate = addDays(date, -lead);
      const source = `analysis-${country}-${slug}`;
      const record: ReviewedComparables = {
        status: "reviewed",
        scorecardSource: source,
        searchDate,
        searchKind: "prepublish",
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
          kind: "prepublish",
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

describe("comparables gate properties", () => {
  test("every well-formed entry after the cutover resolves against an index that lists its search", () => {
    fc.assert(
      fc.property(caseArb, ({ entry, index }) => {
        expect(requiresComparables(entry)).toBe(true);
        expect(validateComparables(entry)).toEqual([]);
        expect(resolveComparables(entry, index)).toEqual([]);
      }),
    );
  });

  test("any one disagreement with the index fails resolution", () => {
    const mutations: Array<(c: Case) => void> = [
      (c) => {
        c.index.analyses = {};
      },
      (c) => {
        c.index.analyses[c.record.scorecardSource].searches[0].found += 1;
      },
      (c) => {
        c.index.analyses[
          c.record.scorecardSource
        ].searches[0].producers_searched.pop();
      },
      (c) => {
        c.index.analyses[c.record.scorecardSource].searches[0].date = addDays(
          c.record.searchDate,
          -1,
        );
      },
      (c) => {
        c.index.analyses[c.record.scorecardSource].searches[0].kind =
          "backfill";
      },
      (c) => {
        c.index.analyses[c.record.scorecardSource].slug += "-x";
      },
      (c) => {
        c.index.analyses[c.record.scorecardSource].country_id =
          c.entry.countryIds[0] === "uk" ? "us" : "uk";
      },
      (c) => {
        c.index.analyses[c.record.scorecardSource].kind =
          c.entry.kind === "app" ? "post" : "app";
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

  test("an entry after the cutover without a block fails", () => {
    fc.assert(
      fc.property(caseArb, ({ entry }) => {
        const bare = { ...entry, comparables: undefined };
        expect(validateComparables(bare).join()).toMatch(
          /no comparables block/,
        );
      }),
    );
  });

  test("a search after publication, or too long before it, fails", () => {
    fc.assert(
      fc.property(
        caseArb,
        fc.oneof(
          fc.integer({ min: 1, max: 365 }),
          fc.integer({ min: -900, max: -(MAX_SEARCH_AGE_DAYS + 1) }),
        ),
        ({ entry, record }, shift) => {
          const moved = {
            ...entry,
            comparables: { ...record, searchDate: addDays(entry.date, shift) },
          };
          expect(validateComparables(moved)).not.toEqual([]);
        },
      ),
    );
  });

  test("an entry after the cutover needs a prepublish search", () => {
    fc.assert(
      fc.property(caseArb, ({ entry, record }) => {
        const backfilled = {
          ...entry,
          comparables: { ...record, searchKind: "backfill" },
        };
        expect(validateComparables(backfilled).join()).toMatch(
          /needs a prepublish search/,
        );
      }),
    );
  });

  test("a policy entry cannot declare no estimate; another can, with a reason", () => {
    fc.assert(
      fc.property(caseArb, ({ entry }) => {
        const noEstimate = {
          status: "no_estimate",
          reason: "An event write-up with no estimate in it.",
        };
        expect(
          validateComparables({ ...entry, comparables: noEstimate }),
        ).not.toEqual([]);
        expect(
          validateComparables({
            ...entry,
            tags: entry.countryIds,
            comparables: noEstimate,
          }),
        ).toEqual([]);
        expect(
          validateComparables({
            ...entry,
            tags: entry.countryIds,
            comparables: { status: "no_estimate", reason: "none" },
          }),
        ).not.toEqual([]);
      }),
    );
  });

  test("a block that names another entry's record fails", () => {
    fc.assert(
      fc.property(caseArb, slugArb, ({ entry, record }, other) => {
        fc.pre(other !== entry.slug);
        const source = `analysis-${entry.countryIds[0]}-${other}`;
        const misnamed = {
          ...entry,
          comparables: {
            ...record,
            scorecardSource: source,
            searchLog: searchLogUrl(source),
          },
        };
        expect(validateComparables(misnamed).join()).toMatch(
          /does not name this entry/,
        );
      }),
    );
  });

  test("entries before the cutover need no block", () => {
    fc.assert(
      fc.property(caseArb, fc.integer({ min: 1, max: 3000 }), (c, before) => {
        const early = {
          ...c.entry,
          date: addDays(COMPARABLES_CUTOVER_DATE, -before),
          comparables: undefined,
        };
        expect(requiresComparables(early)).toBe(false);
        expect(validateComparables(early)).toEqual([]);
      }),
    );
  });
});

describe("comparables helpers", () => {
  test("post slugs follow the website's rule", () => {
    expect(postSlug("UK_Two_Child-limit.md")).toBe("uk-two-child-limit");
    expect(postSlug("2025-spm-poverty-prediction.md")).toBe(
      "2025-spm-poverty-prediction",
    );
  });

  test("research entries are apps listed with research and every post", () => {
    const entries = researchEntries(
      [
        {
          slug: "listed",
          countryId: "uk",
          date: "2026-11-02 12:00:00",
          tags: ["uk", "policy"],
          displayWithResearch: true,
        },
        { slug: "tool", countryId: "us", tags: ["us"] },
      ],
      [{ filename: "A_post.md", date: "2026-11-03", tags: ["us", "uk", "x"] }],
    );
    expect(entries).toEqual([
      {
        kind: "app",
        slug: "listed",
        countryIds: ["uk"],
        date: "2026-11-02",
        tags: ["uk", "policy"],
        comparables: undefined,
      },
      {
        kind: "post",
        slug: "a-post",
        countryIds: ["us", "uk"],
        date: "2026-11-03",
        tags: ["us", "uk", "x"],
        comparables: undefined,
      },
    ]);
  });

  test("an impossible search date fails", () => {
    const entry: ResearchEntry = {
      kind: "app",
      slug: "x",
      countryIds: ["uk"],
      date: addDays(COMPARABLES_CUTOVER_DATE, 5),
      tags: ["uk"],
      comparables: {
        status: "reviewed",
        scorecardSource: "analysis-uk-x",
        searchDate: "2026-02-30",
        searchKind: "prepublish",
        producersSearched: ["obr"],
        found: 0,
        searchLog: searchLogUrl("analysis-uk-x"),
      },
    };
    expect(validateComparables(entry).join()).toMatch(/real YYYY-MM-DD/);
  });
});

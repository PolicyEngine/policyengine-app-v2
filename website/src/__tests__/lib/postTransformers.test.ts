import fc from "fast-check";
import { describe, expect, test } from "vitest";
import appsData from "@/data/apps.json";
import postsData from "@/data/posts/posts.json";
import {
  compareNewestFirst,
  compareResearchItems,
  getPostsSorted,
  getLocationTags,
  getTopicTags,
  getResearchItemKey,
  getResearchItems,
  topicLabels,
  locationLabels,
  getTopicLabel,
  type ResearchItem,
} from "../../data/posts/postTransformers";

/** Each post's place in posts.json, by slug. */
const POSTS_JSON_INDEX = new Map(
  (postsData as Array<{ filename: string }>).map((post, i) => [
    post.filename
      .substring(0, post.filename.indexOf("."))
      .toLowerCase()
      .replace(/_/g, "-"),
    i,
  ]),
);

/** Each research app's place in apps.json. Slugs repeat across countries. */
const APPS_JSON_INDEX = new Map(
  (appsData as Array<{ slug: string; countryId: string }>).map((app, i) => [
    `${app.countryId}/${app.slug}`,
    i,
  ]),
);

function sourceIndex(item: ResearchItem): number {
  return item.isApp
    ? APPS_JSON_INDEX.get(`${item.countryId}/${item.slug}`)!
    : POSTS_JSON_INDEX.get(item.slug)!;
}

describe("getPostsSorted", () => {
  test("returns posts sorted by date descending", () => {
    const posts = getPostsSorted();
    expect(posts.length).toBeGreaterThan(0);
    for (let i = 1; i < posts.length; i++) {
      expect(posts[i - 1].date >= posts[i].date).toBe(true);
    }
  });

  test("given posts on the same date then they keep their posts.json order", () => {
    const posts = getPostsSorted();
    let ties = 0;
    for (let i = 1; i < posts.length; i++) {
      if (posts[i].date !== posts[i - 1].date) continue;
      ties++;
      expect(
        POSTS_JSON_INDEX.get(posts[i].slug)!,
        `${posts[i - 1].slug} then ${posts[i].slug}`,
      ).toBeGreaterThan(POSTS_JSON_INDEX.get(posts[i - 1].slug)!);
    }
    // posts.json has same-date posts (12 pairs as of October 2026).
    expect(ties).toBeGreaterThan(0);
  });

  test("given the sorted posts then sorting them again changes nothing", () => {
    const posts = getPostsSorted();
    expect([...posts].sort(compareNewestFirst)).toEqual(posts);
  });

  test("all posts have slugs", () => {
    const posts = getPostsSorted();
    for (const post of posts) {
      expect(post.slug).toBeTruthy();
      expect(post.slug).not.toContain("_");
      expect(post.slug).toBe(post.slug.toLowerCase());
    }
  });
});

describe("getLocationTags", () => {
  test("returns location tags", () => {
    const tags = getLocationTags();
    expect(tags).toContain("us");
    expect(tags).toContain("uk");
  });

  test("does not include topic tags", () => {
    const locationTags = getLocationTags();
    const topicTags = getTopicTags();
    for (const tag of topicTags) {
      expect(locationTags).not.toContain(tag);
    }
  });
});

describe("getTopicTags", () => {
  test("returns topic tags", () => {
    const tags = getTopicTags();
    expect(tags.length).toBeGreaterThan(0);
  });
});

describe("getResearchItems", () => {
  test("returns items with required fields", () => {
    const items = getResearchItems();
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(item.title).toBeTruthy();
      expect(item.slug).toBeTruthy();
      expect(item.date).toBeTruthy();
      expect(item.countryId).toBeTruthy();
    }
  });

  test("given items on the same date then apps come first, each in its file's order", () => {
    const items = getResearchItems();
    for (let i = 1; i < items.length; i++) {
      const [before, after] = [items[i - 1], items[i]];
      expect(after.date <= before.date).toBe(true);
      if (after.date !== before.date) continue;
      const pair = `${before.slug} then ${after.slug} on ${after.date}`;
      expect(!before.isApp && after.isApp, pair).toBe(false);
      if (before.isApp === after.isApp) {
        expect(sourceIndex(after), pair).toBeGreaterThan(sourceIndex(before));
      }
    }
  });

  test("given the research items then their posts are in getPostsSorted() order", () => {
    const postSlugs = getResearchItems()
      .filter((item) => !item.isApp)
      .map((item) => item.slug);
    expect(postSlugs).toEqual(getPostsSorted().map((post) => post.slug));
  });

  test("given the research items then sorting them again changes nothing", () => {
    const items = getResearchItems();
    expect([...items].sort(compareResearchItems)).toEqual(items);
  });

  test("given the research items then no two share a card key", () => {
    const keys = getResearchItems().map(getResearchItemKey);
    expect(keys.filter((key, i) => keys.indexOf(key) !== i)).toEqual([]);
  });
});

describe("getResearchItemKey", () => {
  const card = (isApp: boolean, countryId: string, slug: string) => ({
    isApp,
    countryId,
    slug,
  });

  test("given the US and UK apps with one slug then their keys differ", () => {
    expect(getResearchItemKey(card(true, "us", "marriage"))).not.toBe(
      getResearchItemKey(card(true, "uk", "marriage")),
    );
  });

  test("given a post and an app with one slug then their keys differ", () => {
    expect(getResearchItemKey(card(false, "us", "marriage"))).not.toBe(
      getResearchItemKey(card(true, "us", "marriage")),
    );
  });

  test("given one post under two countries then its key is the same", () => {
    expect(getResearchItemKey(card(false, "us", "marriage"))).toBe(
      getResearchItemKey(card(false, "uk", "marriage")),
    );
  });

  type Card = { isApp: boolean; countryId: string; slug: string };
  // A post is its slug, since post slugs are unique; an app is its country
  // and slug.
  const sameCard = (a: Card, b: Card) =>
    a.isApp === b.isApp &&
    a.slug === b.slug &&
    (!a.isApp || a.countryId === b.countryId);
  // Slugs are as apps.json allows them (the "slugs are URL-safe" data test).
  // Country ids with "-" or "/" check that the key never mistakes part of a
  // country for part of a slug: with a "-" separator, us-x + x and us + x-x
  // would share a key.
  const COUNTRIES = ["us", "uk", "us-x", "us/"];
  const SLUGS = ["marriage", "x", "x-x", "-"];

  test("given every pair of cards from a small pool then their keys match only when they are the same card", () => {
    const pool = [true, false].flatMap((isApp) =>
      COUNTRIES.flatMap((countryId) =>
        SLUGS.map((slug) => card(isApp, countryId, slug)),
      ),
    );
    for (const a of pool) {
      for (const b of pool) {
        expect(
          getResearchItemKey(a) === getResearchItemKey(b),
          JSON.stringify([a, b]),
        ).toBe(sameCard(a, b));
      }
    }
  });

  test("given any two cards then their keys match only when they are the same card", () => {
    const item = fc.record({
      isApp: fc.boolean(),
      countryId: fc.oneof(
        { weight: 3, arbitrary: fc.constantFrom(...COUNTRIES) },
        { weight: 1, arbitrary: fc.string() },
      ),
      slug: fc.oneof(
        { weight: 3, arbitrary: fc.constantFrom(...SLUGS) },
        { weight: 1, arbitrary: fc.stringMatching(/^[a-z0-9-]+$/) },
      ),
    });

    fc.assert(
      fc.property(item, item, (a, b) => {
        expect(getResearchItemKey(a) === getResearchItemKey(b)).toBe(
          sameCard(a, b),
        );
      }),
      { numRuns: 1000 },
    );
  });
});

describe("date comparators", () => {
  // A few days, with and without times, so generated dates often tie.
  const date = fc.oneof(
    {
      weight: 3,
      arbitrary: fc
        .tuple(
          fc.constantFrom("2023-01-12", "2025-10-28", "2026-03-25"),
          fc.constantFrom("", " 00:00:01", " 12:00", " 12:00:00"),
        )
        .map(([day, time]) => day + time),
    },
    {
      weight: 1,
      arbitrary: fc
        .date({
          min: new Date("2016-01-01T00:00:00Z"),
          max: new Date("2030-12-31T00:00:00Z"),
          noInvalidDate: true,
        })
        .map((d) => d.toISOString().slice(0, 19).replace("T", " ")),
    },
  );
  const item = fc.record({ date, isApp: fc.boolean() });
  // Mostly from two dates, so three items often share a date and kind.
  const tieProneItem = fc.oneof(
    { weight: 1, arbitrary: item },
    {
      weight: 3,
      arbitrary: fc.record({
        date: fc.constantFrom("2025-10-28", "2025-10-28 12:00:00"),
        isApp: fc.boolean(),
      }),
    },
  );
  const sign = (n: number) => Math.sign(n) + 0;

  test.each([
    ["compareNewestFirst", compareNewestFirst],
    ["compareResearchItems", compareResearchItems],
  ] as const)(
    "given any items then %s is a consistent comparator",
    (_, compare) => {
      fc.assert(
        fc.property(tieProneItem, tieProneItem, tieProneItem, (a, b, c) => {
          expect(compare(a, a)).toBe(0);
          expect(sign(compare(b, a))).toBe(sign(-compare(a, b)));
          if (compare(a, b) <= 0 && compare(b, c) <= 0) {
            expect(compare(a, c)).toBeLessThanOrEqual(0);
          }
          if (compare(a, b) === 0 && compare(b, c) === 0) {
            expect(compare(a, c)).toBe(0);
          }
        }),
        { numRuns: 500 },
      );
    },
  );

  test("given any two items then only equal dates compare equal", () => {
    fc.assert(
      fc.property(item, item, (a, b) => {
        expect(compareNewestFirst(a, b) === 0).toBe(a.date === b.date);
        expect(compareResearchItems(a, b) === 0).toBe(
          a.date === b.date && a.isApp === b.isApp,
        );
      }),
      { numRuns: 500 },
    );
  });

  test("given any list then a sort is newest first, apps first on a date, and otherwise keeps input order", () => {
    fc.assert(
      fc.property(fc.array(item, { maxLength: 40 }), (generated) => {
        const indexed = generated.map((it, index) => ({ ...it, index }));
        const sorted = [...indexed].sort(compareResearchItems);

        expect(sorted.map((it) => it.index).sort((x, y) => x - y)).toEqual(
          indexed.map((it) => it.index),
        );
        for (let i = 1; i < sorted.length; i++) {
          const [before, after] = [sorted[i - 1], sorted[i]];
          expect(after.date <= before.date).toBe(true);
          if (after.date !== before.date) continue;
          expect(!before.isApp && after.isApp).toBe(false);
          if (before.isApp === after.isApp) {
            expect(after.index).toBeGreaterThan(before.index);
          }
        }
        // Sorting a sorted list changes nothing.
        expect([...sorted].sort(compareResearchItems)).toEqual(sorted);
        expect([...sorted].sort(compareNewestFirst)).toEqual(sorted);
      }),
      { numRuns: 300 },
    );
  });
});

describe("topicLabels and locationLabels", () => {
  test("topicLabels has entries", () => {
    expect(Object.keys(topicLabels).length).toBeGreaterThan(0);
  });

  test("locationLabels has country entries", () => {
    expect(locationLabels["us"]).toBe("United States");
    expect(locationLabels["uk"]).toBe("United Kingdom");
  });
});

describe("getTopicLabel", () => {
  test("returns UK variant for behavioural responses", () => {
    expect(getTopicLabel("behavioral-responses", "uk")).toBe(
      "Behavioural responses",
    );
  });

  test("returns US variant for behavioral responses", () => {
    expect(getTopicLabel("behavioral-responses", "us")).toBe(
      "Behavioral responses",
    );
  });

  test("returns default label for non-variant tags", () => {
    expect(getTopicLabel("tax", "us")).toBe("Tax");
  });
});

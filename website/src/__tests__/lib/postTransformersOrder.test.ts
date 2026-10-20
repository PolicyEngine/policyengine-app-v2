import fc from "fast-check";
import { afterEach, describe, expect, test, vi } from "vitest";

// getPostsSorted() and getResearchItems() read posts.json and apps.json when
// the module loads, so each run loads a fresh copy over generated files.

interface GeneratedPost {
  title: string;
  description: string;
  date: string;
  authors: string[];
  tags: string[];
  filename: string;
  image: string;
}

interface GeneratedApp {
  title: string;
  description: string;
  date?: string;
  tags: string[];
  slug: string;
  countryId: string;
  displayWithResearch: boolean;
}

async function loadWith(posts: GeneratedPost[], apps: GeneratedApp[]) {
  vi.resetModules();
  vi.doMock("@/data/posts/posts.json", () => ({ default: posts }));
  vi.doMock("@/data/apps.json", () => ({ default: apps }));
  return import("@/data/posts/postTransformers");
}

afterEach(() => {
  vi.doUnmock("@/data/posts/posts.json");
  vi.doUnmock("@/data/apps.json");
  vi.resetModules();
});

// A few days, with and without times, so generated dates often tie.
const date = fc.oneof(
  fc
    .tuple(
      fc.constantFrom("2023-01-12", "2025-10-28", "2026-03-25"),
      fc.constantFrom("", " 00:00:01", " 12:00", " 12:00:00"),
    )
    .map(([day, time]) => day + time),
  fc
    .date({
      min: new Date("2016-01-01T00:00:00Z"),
      max: new Date("2030-12-31T00:00:00Z"),
      noInvalidDate: true,
    })
    .map((d) => d.toISOString().slice(0, 19).replace("T", " ")),
);

const postFiles = fc.array(date, { maxLength: 30 }).map((dates) =>
  dates.map(
    (postDate, i): GeneratedPost => ({
      title: `Post ${i}`,
      description: "",
      date: postDate,
      authors: [],
      tags: ["us"],
      filename: `post_${i}.md`,
      image: "",
    }),
  ),
);

const appFiles = fc
  .array(
    fc.record({
      // An app without a date sorts as 1970-01-01.
      date: fc.option(date, { nil: undefined }),
      displayWithResearch: fc.boolean(),
      countryId: fc.constantFrom("us", "uk"),
    }),
    { maxLength: 15 },
  )
  .map((apps) =>
    apps.map(
      (app, i): GeneratedApp => ({
        ...app,
        title: `App ${i}`,
        description: "",
        tags: [app.countryId],
        slug: `app-${i}`,
      }),
    ),
  );

/** Newest first; on a date, `rank` orders kinds; then source order. */
function expectNewestFirstInSourceOrder<T extends { date: string }>(
  items: T[],
  rank: (item: T) => number,
  sourceIndex: (item: T) => number,
) {
  for (let i = 1; i < items.length; i++) {
    const [before, after] = [items[i - 1], items[i]];
    expect(after.date <= before.date).toBe(true);
    if (after.date !== before.date) continue;
    expect(rank(after)).toBeGreaterThanOrEqual(rank(before));
    if (rank(after) === rank(before)) {
      expect(sourceIndex(after)).toBeGreaterThan(sourceIndex(before));
    }
  }
}

const postIndex = (slug: string) => Number(slug.replace("post-", ""));
const appIndex = (slug: string) => Number(slug.replace("app-", ""));

describe("post and research item order over generated files", () => {
  const params = { numRuns: 150 };

  test("given any posts.json then getPostsSorted() is newest first and keeps file order on a date", async () => {
    await fc.assert(
      fc.asyncProperty(postFiles, async (posts) => {
        const { getPostsSorted } = await loadWith(posts, []);
        const sorted = getPostsSorted();

        expect(
          sorted.map((p) => postIndex(p.slug)).sort((a, b) => a - b),
        ).toEqual(posts.map((_, i) => i));
        expectNewestFirstInSourceOrder(
          sorted,
          () => 0,
          (p) => postIndex(p.slug),
        );
      }),
      params,
    );
  });

  test("given any posts.json and apps.json then getResearchItems() puts apps first on a date and keeps file order", async () => {
    await fc.assert(
      fc.asyncProperty(postFiles, appFiles, async (posts, apps) => {
        const { getPostsSorted, getResearchItems } = await loadWith(
          posts,
          apps,
        );
        const items = getResearchItems();
        const shownApps = apps.filter((app) => app.displayWithResearch);

        expect(items.filter((it) => !it.isApp).map((it) => it.slug)).toEqual(
          getPostsSorted().map((p) => p.slug),
        );
        expect(
          items
            .filter((it) => it.isApp)
            .map((it) => it.slug)
            .sort(),
        ).toEqual(shownApps.map((app) => app.slug).sort());
        for (const item of items.filter((it) => it.isApp)) {
          expect(item.date).toBe(
            apps[appIndex(item.slug)].date ?? "1970-01-01",
          );
        }
        expectNewestFirstInSourceOrder(
          items,
          (it) => (it.isApp ? 0 : 1),
          (it) => (it.isApp ? appIndex(it.slug) : postIndex(it.slug)),
        );
      }),
      params,
    );
  });
});

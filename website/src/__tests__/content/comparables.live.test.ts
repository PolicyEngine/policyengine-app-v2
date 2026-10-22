// @vitest-environment node
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import appsData from "@/data/apps.json";
import {
  bannerHrefs,
  changedEntries,
  checkIndex,
  type ComparablesIndex,
  GRANDFATHERED,
  type Grandfathered,
  grandfatherAdditions,
  promotionProblems,
  publicationProblems,
  requiresComparables,
  researchEntries,
  resolveComparables,
  validateComparables,
} from "@/data/comparables";
import postsData from "@/data/posts/posts.json";

// Every research entry against the scorecard's published index. The
// Comparables gate workflow downloads the index from
// PolicyEngine/policyengine-scorecard's main branch, sets
// COMPARABLES_INDEX_PATH, and sets COMPARABLES_GATE=1 so that a missing
// index fails rather than skips. COMPARABLES_BASE_DIR holds the registries,
// grandfather list and featured banner on the branch the change merges into
// (absent when there is none, as on a scheduled run). Without
// COMPARABLES_GATE (the Tests job, local runs) this file skips, and
// posts-and-apps-data.test.ts still checks every block's shape.
const gate = process.env.COMPARABLES_GATE === "1";
const indexPath = process.env.COMPARABLES_INDEX_PATH;
const baseDir = process.env.COMPARABLES_BASE_DIR;
const BANNER = new URL(
  "../../components/home/FeaturedResearchBanner.tsx",
  import.meta.url,
);

if (gate && !indexPath) {
  throw new Error(
    "COMPARABLES_GATE is set but COMPARABLES_INDEX_PATH is not: the gate has no index to check against",
  );
}

function fromBase<T>(name: string): T | null {
  if (!baseDir) return null;
  const path = join(baseDir, name);
  if (!existsSync(path) || !readFileSync(path, "utf8").trim()) return null;
  const text = readFileSync(path, "utf8");
  return (name.endsWith(".json") ? JSON.parse(text) : text) as T;
}

describe.skipIf(!gate)("comparables against the scorecard index", () => {
  // read inside the tests: a skipped describe still runs its body
  const loadIndex = () =>
    JSON.parse(readFileSync(indexPath as string, "utf8")) as ComparablesIndex;
  const entries = researchEntries(
    appsData as Parameters<typeof researchEntries>[0],
    postsData as Parameters<typeof researchEntries>[1],
  );
  const today = new Date().toISOString().slice(0, 10);

  test("the index is the scorecard's, and applies the same entry rules", () => {
    expect(checkIndex(loadIndex())).toEqual([]);
  });

  test("every research entry has a well-formed block where it needs one, and every block resolves to a complete scorecard record", () => {
    const index = loadIndex();
    const errors = entries.flatMap((entry) => [
      ...validateComparables(entry),
      ...resolveComparables(entry, index),
    ]);
    expect(errors).toEqual([]);
  });

  test("an entry this change lists cites a search fresh today, against the current results, with no gap pending", () => {
    const apps = fromBase<Parameters<typeof researchEntries>[0]>("apps.json");
    const posts = fromBase<Parameters<typeof researchEntries>[1]>("posts.json");
    if (!apps || !posts) return; // no base: a scheduled run, or the first list
    const index = loadIndex();
    const changed = changedEntries(
      researchEntries(apps, posts),
      entries,
    ).filter((entry) => requiresComparables(entry));
    expect(
      changed.flatMap((e) => publicationProblems(e, index, today)),
    ).toEqual([]);
  });

  test("a card this change features links an analysis whose comparables are fresh today", () => {
    const base = fromBase<string>("FeaturedResearchBanner.tsx");
    if (base === null) return;
    const before = new Set(bannerHrefs(base));
    const added = bannerHrefs(readFileSync(BANNER, "utf8")).filter(
      (href) => !before.has(href),
    );
    expect(promotionProblems(added, entries, loadIndex(), today)).toEqual([]);
  });

  test("the grandfather list grows only before the cutover", () => {
    const base = fromBase<Grandfathered>("comparablesGrandfathered.json");
    expect(grandfatherAdditions(base, GRANDFATHERED, today)).toEqual([]);
  });
});

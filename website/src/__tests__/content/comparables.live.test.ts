// @vitest-environment node
import { existsSync, readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import appsData from "@/data/apps.json";
import {
  checkIndex,
  type ComparablesIndex,
  GRANDFATHERED,
  type Grandfathered,
  grandfatherAdditions,
  researchEntries,
  resolveComparables,
  validateComparables,
} from "@/data/comparables";
import postsData from "@/data/posts/posts.json";

// Every research entry against the scorecard's published index. The
// Comparables gate workflow downloads the index from
// PolicyEngine/policyengine-scorecard's main branch, sets
// COMPARABLES_INDEX_PATH, and sets COMPARABLES_GATE=1 so that a missing
// index fails rather than skips. It also sets COMPARABLES_BASE_GRANDFATHERED
// to the grandfather list on the branch the change merges into (empty when
// that branch has none). Without COMPARABLES_GATE (the Tests job, local
// runs) this file skips, and posts-and-apps-data.test.ts still checks every
// block's shape.
const gate = process.env.COMPARABLES_GATE === "1";
const indexPath = process.env.COMPARABLES_INDEX_PATH;
const basePath = process.env.COMPARABLES_BASE_GRANDFATHERED;

if (gate && !indexPath) {
  throw new Error(
    "COMPARABLES_GATE is set but COMPARABLES_INDEX_PATH is not: the gate has no index to check against",
  );
}

describe.skipIf(!gate)("comparables against the scorecard index", () => {
  // read inside the tests: a skipped describe still runs its body
  const loadIndex = () =>
    JSON.parse(readFileSync(indexPath as string, "utf8")) as ComparablesIndex;
  const entries = researchEntries(
    appsData as Parameters<typeof researchEntries>[0],
    postsData as Parameters<typeof researchEntries>[1],
  );

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

  test("the grandfather list grows only before the cutover", () => {
    const base =
      basePath && existsSync(basePath) && readFileSync(basePath, "utf8").trim()
        ? (JSON.parse(readFileSync(basePath, "utf8")) as Grandfathered)
        : null;
    const today = new Date().toISOString().slice(0, 10);
    expect(grandfatherAdditions(base, GRANDFATHERED, today)).toEqual([]);
  });
});

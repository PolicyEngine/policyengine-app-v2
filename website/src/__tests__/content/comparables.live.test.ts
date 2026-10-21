import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import appsData from "@/data/apps.json";
import postsData from "@/data/posts/posts.json";
import {
  type ComparablesIndex,
  requiresComparables,
  researchEntries,
  resolveComparables,
} from "@/data/comparables";

// Every research entry's comparables block against the scorecard's published
// index. The Comparables gate workflow downloads the index from
// PolicyEngine/policyengine-scorecard's main branch and sets
// COMPARABLES_INDEX_PATH; without it (the Tests job, local runs) this file
// skips, and posts-and-apps-data.test.ts still checks every block's shape.
const indexPath = process.env.COMPARABLES_INDEX_PATH;

describe.skipIf(!indexPath)("comparables against the scorecard index", () => {
  const index = indexPath
    ? (JSON.parse(readFileSync(indexPath, "utf8")) as ComparablesIndex)
    : null;
  const entries = researchEntries(
    appsData as Parameters<typeof researchEntries>[0],
    postsData as Parameters<typeof researchEntries>[1],
  );

  test("every research entry on or after the cutover resolves to a complete scorecard record", () => {
    const errors = entries
      .filter(requiresComparables)
      .flatMap((entry) => resolveComparables(entry, index!));
    expect(errors).toEqual([]);
  });

  test("every other comparables block resolves too", () => {
    const errors = entries
      .filter((entry) => !requiresComparables(entry))
      .flatMap((entry) => resolveComparables(entry, index!));
    expect(errors).toEqual([]);
  });
});

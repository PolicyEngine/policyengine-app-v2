import { describe, expect, test } from "vitest";

import {
  searchResearchItems,
  type ResearchSearchIndexEntry,
} from "@/lib/researchSearch";
import type { ResearchItem } from "@/data/posts/postTransformers";

const mansionTaxArticle: ResearchItem = {
  title: "Estimating the constituency distribution of a mansion tax",
  description:
    "Three central London constituencies account for a fifth of property sales above £2 million.",
  date: "2025-11-24",
  authors: ["max-ghenis"],
  tags: ["uk", "policy", "tax"],
  image: "",
  slug: "uk-mansion-tax-autumn-budget",
  isApp: false,
  countryId: "uk",
};

const searchIndex: ResearchSearchIndexEntry[] = [
  {
    slug: mansionTaxArticle.slug,
    content:
      "London constituencies account for 45-46% of all affected properties. Outside London, the constituencies with the most high-value sales are Runnymede and Weybridge (183), Queen's Park and Maida Vale (166).",
  },
];

describe("searchResearchItems", () => {
  test("returns an article for a phrase found only in its body", () => {
    const results = searchResearchItems(
      [mansionTaxArticle],
      searchIndex,
      "Runnymede and Weybridge",
    );

    expect(results).toHaveLength(1);
    expect(results[0].slug).toBe(mansionTaxArticle.slug);
    expect(results[0].searchExcerpt?.text).toContain("Runnymede and Weybridge");
    expect(results[0].searchExcerpt?.highlightedText).toBe(
      "Runnymede and Weybridge",
    );
  });

  test("keeps the normal description when the query matches metadata", () => {
    const results = searchResearchItems(
      [mansionTaxArticle],
      searchIndex,
      "central London constituencies",
    );

    expect(results).toHaveLength(1);
    expect(results[0].searchExcerpt).toBeUndefined();
    expect(results[0].description).toBe(mansionTaxArticle.description);
  });

  test("matches body phrases case-insensitively and keeps them inside a bounded excerpt", () => {
    const results = searchResearchItems(
      [mansionTaxArticle],
      searchIndex,
      "RUNNYMEDE AND WEYBRIDGE",
    );

    const excerpt = results[0].searchExcerpt;
    expect(excerpt).toBeDefined();
    expect(excerpt!.text.length).toBeLessThanOrEqual(183);
    expect(excerpt!.highlightStart).toBeGreaterThanOrEqual(0);
    expect(
      excerpt!.text.slice(excerpt!.highlightStart, excerpt!.highlightEnd),
    ).toBe("Runnymede and Weybridge");
  });

  test("highlights the visible phrase for a fuzzy punctuation match", () => {
    const results = searchResearchItems(
      [mansionTaxArticle],
      searchIndex,
      "Runnymede & Weybridge",
    );

    expect(results[0].searchExcerpt?.highlightedText).toBe(
      "Runnymede and Weybridge",
    );
  });
});

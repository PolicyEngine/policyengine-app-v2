import { describe, expect, test } from "vitest";

import { getResearchItems } from "@/data/posts/postTransformers";
import { searchResearchItems } from "@/lib/researchSearch";
import {
  buildResearchSearchIndex,
  getSearchableArticleText,
} from "@/lib/researchSearchCorpus";

describe("getSearchableArticleText", () => {
  test("keeps reader-visible markdown text while removing presentation syntax", () => {
    const markdown = [
      "## Key findings",
      "The [constituency lookup](https://example.com) includes **Runnymede and Weybridge**.",
      "```plotly",
      '{ "internal": "chart configuration" }',
      "```",
    ].join("\n");

    const text = getSearchableArticleText("example.md", markdown);

    expect(text).toContain("Key findings");
    expect(text).toContain("constituency lookup");
    expect(text).toContain("Runnymede and Weybridge");
    expect(text).not.toContain("https://example.com");
    expect(text).not.toContain("chart configuration");
  });

  test("indexes notebook markdown cells but not code cells", () => {
    const notebook = JSON.stringify({
      cells: [
        {
          cell_type: "markdown",
          source: ["A reader-visible finding about household incomes."],
        },
        {
          cell_type: "code",
          source: ["private_internal_variable = 42"],
        },
      ],
    });

    const text = getSearchableArticleText("example.ipynb", notebook);

    expect(text).toContain("reader-visible finding");
    expect(text).not.toContain("private_internal_variable");
  });
});

describe("buildResearchSearchIndex", () => {
  test("includes text from the real mansion-tax article body", () => {
    const searchIndex = buildResearchSearchIndex();
    const entry = searchIndex.find(
      (item) => item.slug === "uk-mansion-tax-autumn-budget",
    );

    expect(entry?.content).toContain("Runnymede and Weybridge");

    const results = searchResearchItems(
      getResearchItems(),
      searchIndex,
      "Runnymede and Weybridge",
    );
    expect(results[0].slug).toBe("uk-mansion-tax-autumn-budget");
    expect(results[0].searchExcerpt?.highlightedText).toBe(
      "Runnymede and Weybridge",
    );
  });
});

import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { BlogPostCard } from "@/app/[countryId]/research/ResearchClient";
import { colors } from "@/designTokens";
import type { ResearchSearchResult } from "@/lib/researchSearch";

const baseItem: ResearchSearchResult = {
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

describe("BlogPostCard search excerpts", () => {
  test("replaces the description with a quoted italic highlighted body excerpt", () => {
    const text =
      "Outside London, Runnymede and Weybridge had 183 high-value sales.";
    const highlightedText = "Runnymede and Weybridge";
    const highlightStart = text.indexOf(highlightedText);

    render(
      <BlogPostCard
        item={{
          ...baseItem,
          searchExcerpt: {
            text,
            highlightedText,
            highlightStart,
            highlightEnd: highlightStart + highlightedText.length,
          },
        }}
        countryId="uk"
      />,
    );

    const highlight = screen.getByText(highlightedText);
    expect(highlight.tagName).toBe("MARK");
    expect(highlight).toHaveStyle({ backgroundColor: colors.primary[100] });
    expect(highlight.parentElement).toHaveStyle({ fontStyle: "italic" });
    expect(highlight.parentElement?.textContent).toBe(`“${text}”`);
    expect(screen.queryByText(baseItem.description)).not.toBeInTheDocument();
  });

  test("renders the original description when there is no body-only match", () => {
    render(<BlogPostCard item={baseItem} countryId="uk" />);

    expect(screen.getByText(baseItem.description)).toBeInTheDocument();
    expect(screen.queryByRole("mark")).not.toBeInTheDocument();
  });
});

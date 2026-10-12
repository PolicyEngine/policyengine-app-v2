import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, test, vi } from "vitest";

import { READER_TIME_ZONES, inTimeZone } from "@/__tests__/helpers/timeZone";
import ArticleClient from "@/app/[countryId]/research/[slug]/ArticleClient";
import { BlogPostCard } from "@/app/[countryId]/research/ResearchClient";
import type { ResearchSearchResult } from "@/lib/researchSearch";
import type { BlogPost } from "@/types/blog";

const BARE_DATE_ITEM: ResearchSearchResult = {
  title: "Introducing PolicyBench",
  description: "A benchmark for policy analysis.",
  date: "2026-06-16",
  authors: ["max-ghenis"],
  tags: ["us", "ai"],
  image: "",
  slug: "introducing-policybench",
  isApp: false,
  countryId: "us",
};

const BARE_DATE_POST: BlogPost = {
  title: BARE_DATE_ITEM.title,
  description: BARE_DATE_ITEM.description,
  date: BARE_DATE_ITEM.date,
  authors: BARE_DATE_ITEM.authors,
  tags: BARE_DATE_ITEM.tags,
  filename: "introducing-policybench.md",
  image: "",
  slug: BARE_DATE_ITEM.slug,
};

beforeAll(() => {
  // jsdom has no matchMedia; the article's display-category hook reads it.
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

describe.each(READER_TIME_ZONES)(
  "post dates with TZ=$timeZone",
  ({ timeZone }) => {
    inTimeZone(timeZone);

    test("given a bare date then the research card shows that day", () => {
      render(<BlogPostCard item={BARE_DATE_ITEM} countryId="us" />);

      expect(screen.getByText("Jun 16, 2026")).toBeInTheDocument();
      expect(screen.queryByText("Jun 15, 2026")).not.toBeInTheDocument();
    });

    test("given a timestamp then the research card shows its day", () => {
      render(
        <BlogPostCard
          item={{ ...BARE_DATE_ITEM, date: "2026-09-29 08:00:00" }}
          countryId="us"
        />,
      );

      expect(screen.getByText("Sep 29, 2026")).toBeInTheDocument();
    });

    test("given a bare date then the article header shows that day", () => {
      render(
        <ArticleClient
          post={BARE_DATE_POST}
          content="Post body."
          isNotebook={false}
          countryId="us"
        />,
      );

      expect(screen.getAllByText("June 16, 2026").length).toBeGreaterThan(0);
      expect(screen.queryByText("June 15, 2026")).not.toBeInTheDocument();
    });
  },
);

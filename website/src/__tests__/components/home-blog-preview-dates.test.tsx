import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import { READER_TIME_ZONES, inTimeZone } from "@/__tests__/helpers/timeZone";
import HomeBlogPreview from "@/components/home/HomeBlogPreview";
import type { ResearchItem } from "@/data/posts/postTransformers";

function researchItem(slug: string, date: string): ResearchItem {
  return {
    title: `Post ${slug}`,
    description: `Description ${slug}`,
    date,
    authors: ["max-ghenis"],
    tags: ["us"],
    image: "",
    slug,
    isApp: false,
    countryId: "us",
  };
}

// Two primary cards and three secondary cards, mixing bare dates and
// timestamps, including the first and last days of a year.
const ITEMS = [
  researchItem("primary-bare", "2026-06-16"),
  researchItem("primary-timestamp", "2026-06-15 08:00:00"),
  researchItem("secondary-new-year", "2026-01-01"),
  researchItem("secondary-new-years-eve", "2025-12-31"),
  researchItem("secondary-late-timestamp", "2025-12-30 23:30:00"),
];

vi.mock("@/data/posts/postTransformers", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/data/posts/postTransformers")>()),
  getResearchItems: () => ITEMS,
}));

describe.each(READER_TIME_ZONES)(
  "HomeBlogPreview with TZ=$timeZone",
  ({ timeZone }) => {
    inTimeZone(timeZone);

    test("given bare dates and timestamps then each card shows its own day", () => {
      render(<HomeBlogPreview countryId="us" />);

      for (const text of [
        "Jun 16, 2026",
        "Jun 15, 2026",
        "Jan 1, 2026",
        "Dec 31, 2025",
        "Dec 30, 2025",
      ]) {
        expect(screen.getByText(text)).toBeInTheDocument();
      }
      expect(screen.queryByText("Dec 29, 2025")).not.toBeInTheDocument();
    });
  },
);

import { render, screen, within } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

// MOCK_APPS stands in for apps.json, so these tests show the homepage reads
// its tools and featured research from the registry: a new flagged tool gets
// a card in label order, copy comes from the entry, and a missing featured
// entry is skipped.
vi.mock("@/data/apps.json", () => ({
  default: [
    {
      slug: "zeta-tool",
      countryId: "us",
      title: "Zeta tool",
      description: "Mocked zeta copy.",
      toolsMenu: { label: "Zeta tool" },
    },
    {
      slug: "alpha-tool",
      countryId: "us",
      title: "Alpha tool",
      description: "Mocked alpha copy.",
      toolsMenu: { label: "Alpha tool" },
    },
    {
      slug: "unflagged",
      countryId: "us",
      title: "Unflagged",
      description: "Mocked unflagged copy.",
    },
    {
      slug: "bill-tracker",
      countryId: "us",
      title: "Mocked tracker title",
      description: "Mocked tracker copy.",
      image: "mocked-tracker.webp",
    },
  ],
}));

import HomeFeaturedResearch from "@/components/home/HomeFeaturedResearch";
import HomeToolsPreview from "@/components/home/HomeToolsPreview";

describe("homepage sections over mocked apps.json", () => {
  test("lists the main app, then the flagged tools by label, with each entry's copy", () => {
    render(<HomeToolsPreview countryId="us" />);
    const cards = screen.getAllByRole("link");

    expect(cards.map((card) => card.getAttribute("href"))).toEqual([
      "https://app.policyengine.org/us",
      "/us/alpha-tool",
      "/us/zeta-tool",
    ]);
    expect(
      within(cards[1]).getByText("Mocked alpha copy."),
    ).toBeInTheDocument();
    expect(within(cards[2]).getByText("Mocked zeta copy.")).toBeInTheDocument();
  });

  test("features only the entries apps.json has, with their copy and image", () => {
    const { container } = render(<HomeFeaturedResearch countryId="us" />);
    const cards = screen.getAllByRole("link");

    expect(cards).toHaveLength(1);
    expect(cards[0]).toHaveAttribute("href", "/us/bill-tracker");
    expect(
      within(cards[0]).getByText("Mocked tracker title"),
    ).toBeInTheDocument();
    expect(
      within(cards[0]).getByText("Mocked tracker copy."),
    ).toBeInTheDocument();
    expect(container.querySelector("img")).toHaveAttribute(
      "src",
      "/assets/posts/mocked-tracker.webp",
    );
  });
});

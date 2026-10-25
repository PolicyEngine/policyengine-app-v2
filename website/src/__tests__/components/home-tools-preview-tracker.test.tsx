import { render, screen, within } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

// The tracker listed last and with copy unlike the real list's, so the card
// can only show it by reading the list.
vi.mock("@/data/featuredTools.json", () => ({
  default: {
    us: [
      {
        slug: "obbba-households",
        label: "OBBBA household explorer",
        description: "Explorer description.",
      },
      {
        slug: "cliffwatch",
        label: "CliffWatch",
        description: "CliffWatch description.",
      },
      {
        slug: "bill-tracker",
        label: "State legislative tracker",
        description: "Mocked tracker copy.",
      },
    ],
  },
}));

import HomeToolsPreview from "@/components/home/HomeToolsPreview";

describe("HomeToolsPreview with the tracker in the list", () => {
  test("given the tracker's list entry then its card shows that entry's copy", () => {
    render(<HomeToolsPreview countryId="us" />);

    const card = screen.getByRole("link", {
      name: /State legislative tracker/,
    });
    // Exact match: the paragraph is the entry's copy and nothing else.
    expect(within(card).getByText("Mocked tracker copy.")).toBeInTheDocument();
  });

  test("given the tracker anywhere in the list then it gets the first card and the others keep list order", () => {
    const { container } = render(<HomeToolsPreview countryId="us" />);

    const toolHrefs = Array.from(container.querySelectorAll("a"))
      .map((link) => link.getAttribute("href"))
      .filter((href) => href !== "/us/research?types=interactive");
    expect(toolHrefs).toEqual([
      "/us/bill-tracker",
      "/us/obbba-households",
      "/us/cliffwatch",
    ]);
  });
});

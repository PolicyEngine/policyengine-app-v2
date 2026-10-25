import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

// A list without the tracker and with a tool the component has no icon for,
// to check the homepage follows the shared list rather than its own copy.
vi.mock("@/data/featuredTools.json", () => ({
  default: {
    us: [
      {
        slug: "cliffwatch",
        label: "CliffWatch",
        description: "CliffWatch description.",
      },
      {
        slug: "new-tool",
        label: "New tool",
        description: "New tool description.",
      },
    ],
  },
}));

import HomeToolsPreview from "@/components/home/HomeToolsPreview";

describe("HomeToolsPreview with another tools list", () => {
  test("given the list has no tracker then shows no tracker card", () => {
    const { container } = render(<HomeToolsPreview countryId="us" />);

    expect(container.querySelector('a[href="/us/bill-tracker"]')).toBeNull();
    expect(screen.queryByText(/legislative tracker/i)).toBeNull();
  });

  test("given a new tool in the list then the homepage links it with its copy", () => {
    render(<HomeToolsPreview countryId="us" />);

    const card = screen.getByRole("link", { name: /New tool/ });
    expect(card).toHaveAttribute("href", "/us/new-tool");
    expect(card).toHaveTextContent("New tool description.");
  });

  test("given the list then the homepage links exactly its tools in order", () => {
    const { container } = render(<HomeToolsPreview countryId="us" />);

    const toolHrefs = Array.from(container.querySelectorAll("a"))
      .map((link) => link.getAttribute("href"))
      .filter((href) => href !== "/us/research?types=interactive");
    expect(toolHrefs).toEqual(["/us/cliffwatch", "/us/new-tool"]);
  });
});

import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, test, vi } from "vitest";

// Mark client-side links so the tests can tell them from full page loads.
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: ReactNode;
  }) => (
    <a href={href} data-next-link="" {...props}>
      {children}
    </a>
  ),
}));

import HomeToolsPreview from "@/components/home/HomeToolsPreview";
import { getFeaturedTools } from "@/lib/featuredTools";

function linkHrefs(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll("a")).map(
    (link) => link.getAttribute("href") ?? "",
  );
}

describe("HomeToolsPreview", () => {
  test("given the US homepage then links CliffWatch and the OBBBA household explorer", () => {
    render(<HomeToolsPreview countryId="us" />);

    expect(screen.getByRole("link", { name: /CliffWatch/ })).toHaveAttribute(
      "href",
      "/us/cliffwatch",
    );
    expect(
      screen.getByRole("link", { name: /OBBBA household explorer/ }),
    ).toHaveAttribute("href", "/us/obbba-households");
    expect(
      screen.getByRole("link", { name: /State legislative tracker/ }),
    ).toHaveAttribute("href", "/us/bill-tracker");
  });

  test("given the US homepage then links every featured US tool exactly once", () => {
    const { container } = render(<HomeToolsPreview countryId="us" />);
    const hrefs = linkHrefs(container);

    for (const tool of getFeaturedTools("us")) {
      expect(hrefs.filter((href) => href === tool.href)).toHaveLength(1);
    }
  });

  test("given the US homepage then tool cards are full page loads", () => {
    const { container } = render(<HomeToolsPreview countryId="us" />);
    const toolHrefs = new Set(getFeaturedTools("us").map((tool) => tool.href));

    const toolLinks = Array.from(container.querySelectorAll("a")).filter(
      (link) => toolHrefs.has(link.getAttribute("href") ?? ""),
    );
    expect(toolLinks).toHaveLength(toolHrefs.size);
    for (const link of toolLinks) {
      expect(link).not.toHaveAttribute("data-next-link");
    }
  });

  test("given the US homepage then links all interactive tools", () => {
    render(<HomeToolsPreview countryId="us" />);

    expect(screen.getByText("Interactive tools")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /View all tools/ }),
    ).toHaveAttribute("href", "/us/research?types=interactive");
  });

  test("given the UK homepage then renders nothing", () => {
    const { container } = render(<HomeToolsPreview countryId="uk" />);

    expect(container).toBeEmptyDOMElement();
  });
});

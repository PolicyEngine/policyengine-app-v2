import { render, screen, within } from "@testing-library/react";
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
import { getToolsMenu } from "@/lib/toolsMenu";

describe("HomeToolsPreview", () => {
  test.each(["us", "uk"])(
    "given %s then shows a card per Tools menu row, in the menu's order",
    (countryId) => {
      render(<HomeToolsPreview countryId={countryId} />);

      expect(
        screen.getByRole("heading", { level: 2, name: "Tools" }),
      ).toBeInTheDocument();
      const cards = screen.getAllByRole("link");
      const menu = getToolsMenu(countryId);
      expect(cards.map((card) => card.getAttribute("href"))).toEqual(
        menu.map((tool) => tool.href),
      );
      menu.forEach((tool, i) => {
        expect(within(cards[i]).getByText(tool.label)).toBeInTheDocument();
        expect(
          within(cards[i]).getByText(tool.description),
        ).toBeInTheDocument();
      });
    },
  );

  test.each(["us", "uk"])(
    "given %s then every card is a full page load",
    (countryId) => {
      render(<HomeToolsPreview countryId={countryId} />);

      for (const card of screen.getAllByRole("link")) {
        expect(card).not.toHaveAttribute("data-next-link");
      }
    },
  );

  test("given the US then the first card opens the main app", () => {
    render(<HomeToolsPreview countryId="us" />);

    const first = screen.getAllByRole("link")[0];
    expect(first).toHaveAttribute("href", "https://app.policyengine.org/us");
    expect(within(first).getByText("PolicyEngine app")).toBeInTheDocument();
  });

  test("given the US then leaves the OBBBA explorer and the bill tracker to featured research", () => {
    render(<HomeToolsPreview countryId="us" />);

    const hrefs = screen
      .getAllByRole("link")
      .map((card) => card.getAttribute("href"));
    expect(hrefs).not.toContain("/us/obbba-households");
    expect(hrefs).not.toContain("/us/bill-tracker");
  });

  test("given a country with no tools then renders nothing", () => {
    const { container } = render(<HomeToolsPreview countryId="ca" />);

    expect(container).toBeEmptyDOMElement();
  });
});

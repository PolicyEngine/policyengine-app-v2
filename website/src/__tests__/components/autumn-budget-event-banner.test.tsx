import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import AutumnBudgetEventBanner from "@/components/home/AutumnBudgetEventBanner";
import { appZoneRewrites } from "@/data/appZoneRoutes";

const MILBURN_LINK_NAME = /milburn review/i;

describe("AutumnBudgetEventBanner", () => {
  test("links the UK home page to the Milburn review dashboard, which an app zone serves", () => {
    render(<AutumnBudgetEventBanner countryId="uk" />);

    const link = screen.getByRole("link", { name: MILBURN_LINK_NAME });
    expect(link).toHaveAttribute("href", "/uk/milburn-review");
    expect(appZoneRewrites.map((route) => route.source)).toContain(
      "/uk/milburn-review",
    );
  });

  test("keeps the Budget dashboard's link beside the Milburn review's", () => {
    render(<AutumnBudgetEventBanner countryId="uk" />);

    expect(
      screen.getByRole("link", { name: /analysis of Autumn Budget 2026/i }),
    ).toHaveAttribute("href", "/uk/budgets/autumn-2026");
  });

  test("gives the Milburn review its own row, in its own colour, before the Budget's", () => {
    render(<AutumnBudgetEventBanner countryId="uk" />);

    const milburn = screen.getByTestId("milburn-banner");
    const budget = screen.getByTestId("budget-banner");
    expect(
      milburn.compareDocumentPosition(budget) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(milburn.style.background).not.toBe(budget.style.background);
    expect(milburn).toContainElement(
      screen.getByRole("link", { name: MILBURN_LINK_NAME }),
    );
  });

  // Voice control matches a link by its visible text, so each aria-label
  // starts with it.
  test("starts every link's aria-label with its visible text", () => {
    render(<AutumnBudgetEventBanner countryId="uk" />);

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(3);
    for (const link of links) {
      const visible = link.textContent!.replace("→", "").trim().toLowerCase();
      const label = link.getAttribute("aria-label")!.toLowerCase();
      expect(label.slice(0, visible.length)).toBe(visible);
    }
  });

  test.each(["us", "ca"])(
    "given the %s home page then it shows nothing",
    (countryId) => {
      const { container } = render(
        <AutumnBudgetEventBanner countryId={countryId} />,
      );

      expect(container).toBeEmptyDOMElement();
    },
  );
});

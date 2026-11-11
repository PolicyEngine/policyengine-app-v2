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

import HomeFeaturedResearch from "@/components/home/HomeFeaturedResearch";
import { getFeaturedResearch } from "@/lib/featuredResearch";

describe("HomeFeaturedResearch", () => {
  test("given the US then features the bill tracker, then the OBBBA explorer", () => {
    render(<HomeFeaturedResearch countryId="us" />);

    expect(
      screen.getByRole("heading", { level: 2, name: "Featured research" }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("link").map((card) => card.getAttribute("href")),
    ).toEqual(["/us/bill-tracker", "/us/obbba-households"]);
  });

  test("given the US then each card shows its item's copy and image, as a full page load", () => {
    const { container } = render(<HomeFeaturedResearch countryId="us" />);
    const cards = screen.getAllByRole("link");

    getFeaturedResearch("us").forEach((item, i) => {
      expect(within(cards[i]).getByText(item.title)).toBeInTheDocument();
      expect(within(cards[i]).getByText(item.description)).toBeInTheDocument();
      expect(cards[i]).not.toHaveAttribute("data-next-link");
    });
    expect(
      Array.from(container.querySelectorAll("img")).map((img) =>
        img.getAttribute("src"),
      ),
    ).toEqual(getFeaturedResearch("us").map((item) => item.image));
  });

  test.each(["uk", "ca"])("given %s then renders nothing", (countryId) => {
    const { container } = render(
      <HomeFeaturedResearch countryId={countryId} />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});

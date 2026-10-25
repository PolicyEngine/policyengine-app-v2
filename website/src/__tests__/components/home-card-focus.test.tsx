import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import HomeFeaturedResearch from "@/components/home/HomeFeaturedResearch";
import HomeToolsPreview from "@/components/home/HomeToolsPreview";

// Keyboard users must see which card has focus. jsdom can't draw an outline,
// so this checks the classes that do; theme-variables.test.ts checks that no
// class reads a variable the build leaves undefined.
const FOCUS_OUTLINE = [
  "tw:focus-visible:outline-2",
  "tw:focus-visible:outline-primary-500",
];

describe("homepage card focus", () => {
  test.each([
    ["tools", () => <HomeToolsPreview countryId="us" />],
    ["UK tools", () => <HomeToolsPreview countryId="uk" />],
    ["featured research", () => <HomeFeaturedResearch countryId="us" />],
  ])("every %s card shows a primary outline on keyboard focus", (_, ui) => {
    render(ui());

    const cards = screen.getAllByRole("link");
    expect(cards.length).toBeGreaterThan(0);
    for (const card of cards) {
      const classes = card.className.split(/\s+/);
      expect(classes).toEqual(expect.arrayContaining(FOCUS_OUTLINE));
      expect(classes.filter((name) => name.endsWith("outline-none"))).toEqual(
        [],
      );
      // The outline appears at once instead of animating in.
      expect(
        classes.filter((name) =>
          /transition-all|transition-\[[^\]]*outline/.test(name),
        ),
      ).toEqual([]);
    }
  });
});

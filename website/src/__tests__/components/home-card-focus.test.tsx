import { readFileSync } from "node:fs";
import path from "node:path";
import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import HomeFeaturedResearch from "@/components/home/HomeFeaturedResearch";
import HomeToolsPreview from "@/components/home/HomeToolsPreview";

// Keyboard users must see which card has focus. jsdom can't draw an outline,
// so this checks the classes that do; theme-variables.test.ts checks that no
// class reads a variable the build leaves undefined.

const globalsCss = readFileSync(
  path.resolve(__dirname, "../../app/globals.css"),
  "utf8",
);

/** A colour from globals.css's @theme, as [r, g, b]. */
function themeColour(name: string): number[] {
  const hex = globalsCss.match(
    new RegExp(`--color-${name}:\\s*#([0-9a-f]{6})\\b`, "i"),
  )?.[1];
  if (!hex) throw new Error(`--color-${name} is not a hex colour in @theme`);
  return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
}

function rgb(css: string | undefined): number[] {
  const parts = css?.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  if (!parts) throw new Error(`expected an rgb() background, got ${css}`);
  return parts.slice(1).map(Number);
}

/** WCAG's contrast ratio between two colours. */
function contrast(a: number[], b: number[]): number {
  const luminance = (colour: number[]) => {
    const [r, g, bl] = colour.map((c) => {
      const s = c / 255;
      return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

/**
 * Whether a class sets a transition that animates the outline. Tailwind's
 * `transition`, `transition-all` and `transition-colors` all include
 * outline-color, so only these are safe.
 */
function animatesOutline(className: string): boolean {
  const utility = className.split(":").pop() ?? "";
  if (!/^transition(-|$)/.test(utility)) return false;
  const safe = [
    "transition-none",
    "transition-shadow",
    "transition-transform",
    "transition-opacity",
    "transition-discrete",
    "transition-normal",
  ];
  if (safe.includes(utility)) return false;
  const list = utility.match(/^transition-\[(.*)\]$/)?.[1];
  return list === undefined || /all|outline/.test(list);
}

describe("homepage card focus", () => {
  test.each([
    ["tools", () => <HomeToolsPreview countryId="us" />],
    ["UK tools", () => <HomeToolsPreview countryId="uk" />],
    ["featured research", () => <HomeFeaturedResearch countryId="us" />],
  ])("every %s card shows a visible outline on keyboard focus", (_, ui) => {
    render(ui());

    const cards = screen.getAllByRole("link");
    expect(cards.length).toBeGreaterThan(0);
    for (const card of cards) {
      const classes = card.className.split(/\s+/);
      const width = classes.flatMap(
        (name) => name.match(/^tw:focus-visible:outline-(\d+)$/)?.[1] ?? [],
      );
      const colour = classes.flatMap(
        (name) =>
          name.match(
            /^tw:focus-visible:outline-(?!offset-)([a-z]+-\d+)$/,
          )?.[1] ?? [],
      );

      // At least 2px wide, and at least 3:1 against the section behind it (WCAG
      // 1.4.11), since the offset draws it outside the card.
      expect(width).toHaveLength(1);
      expect(Number(width[0])).toBeGreaterThanOrEqual(2);
      expect(colour).toHaveLength(1);
      const behind = rgb(card.closest("section")?.style.backgroundColor);
      expect(contrast(themeColour(colour[0]), behind)).toBeGreaterThanOrEqual(
        3,
      );

      expect(classes.filter((name) => name.endsWith("outline-none"))).toEqual(
        [],
      );
      // The outline appears at once instead of animating in.
      expect(classes.filter(animatesOutline)).toEqual([]);
    }
  });

  test("only transitions that leave the outline alone pass the check", () => {
    expect(
      [
        "tw:transition",
        "tw:transition-all",
        "tw:transition-colors",
        "tw:motion-safe:transition-all",
        "tw:transition-[outline-color]",
        "tw:transition-[box-shadow,all]",
      ].filter((name) => !animatesOutline(name)),
    ).toEqual([]);
    expect(
      [
        "tw:transition-[box-shadow,translate]",
        "tw:transition-shadow",
        "tw:transition-transform",
        "tw:transition-none",
        "tw:duration-300",
      ].filter(animatesOutline),
    ).toEqual([]);
  });
});

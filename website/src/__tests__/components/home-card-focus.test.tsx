import { readFileSync } from "node:fs";
import path from "node:path";
import tailwindcss from "@tailwindcss/postcss";
import { render, screen } from "@testing-library/react";
import postcss, { type Root } from "postcss";
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

// Class names are built at run time: Tailwind scans this file too, and a class
// written out here would ship in the site's CSS.
const P = "tw:";

/**
 * A class's variants and its utility, after the tw prefix: hover:shadow-md
 * has the variant hover and the utility shadow-md.
 */
function parseClass(className: string): {
  variants: string[];
  utility: string;
} {
  const segments = [""];
  let depth = 0;
  for (const char of className) {
    if (char === ":" && depth === 0) {
      segments.push("");
      continue;
    }
    if (char === "[" || char === "(") depth++;
    if (char === "]" || char === ")") depth--;
    segments[segments.length - 1] += char;
  }
  const utility = segments.pop() ?? "";
  return {
    variants: segments[0] === "tw" ? segments.slice(1) : segments,
    utility,
  };
}

/** Whether a transition-property list can include the outline. */
function listsOutline(list: string): boolean {
  return list
    .split(/[\s,_]+/)
    .some(
      (name) =>
        name === "all" || name.startsWith("outline") || name.startsWith("var("),
    );
}

/**
 * How a utility sets transition-property: to a list without the outline, to
 * one that may include it, or not at all. Tailwind's `transition`,
 * `transition-all` and `transition-colors` include outline-color. A
 * `transition` shorthand counts as unsafe, even one that names a safe
 * property.
 */
function setsTransition(utility: string): "safe" | "unsafe" | undefined {
  const arbitrary = utility.match(/^\[([\w-]+):(.*)\]$/);
  if (arbitrary) {
    const [, property, value] = arbitrary;
    if (property === "transition-property") {
      return listsOutline(value) ? "unsafe" : "safe";
    }
    return property === "transition" ? "unsafe" : undefined;
  }
  if (!/^transition(-|$)/.test(utility)) return undefined;
  // These set transition-behavior.
  if (/^transition-(discrete|normal)$/.test(utility)) return undefined;
  const safe = [
    "transition-none",
    "transition-opacity",
    "transition-shadow",
    "transition-transform",
  ];
  if (safe.includes(utility)) return "safe";
  const list = utility.match(/^transition-\[(.*)\]$/)?.[1];
  return list !== undefined && !listsOutline(list) ? "safe" : "unsafe";
}

/** Whether a utility sets a transition duration above zero. */
function setsDuration(utility: string): boolean {
  const duration =
    utility.match(/^\[transition-duration:(.*)\]$/)?.[1] ??
    utility.match(/^duration-(.+)$/)?.[1];
  return (
    duration !== undefined &&
    duration !== "initial" &&
    !/^\[?0(m?s)?\]?$/.test(duration)
  );
}

/**
 * Whether a card's classes animate its outline. CSS's initial
 * transition-property is `all`, so a duration animates the outline unless a
 * transition-property utility without a variant leaves it out.
 */
function animatesOutline(classes: string[]): boolean {
  const parsed = classes.map(parseClass);
  const sets = parsed.map(({ utility }) => setsTransition(utility));
  if (sets.includes("unsafe")) return true;
  const baseList = parsed.some(
    ({ variants }, i) => variants.length === 0 && sets[i] === "safe",
  );
  return !baseList && parsed.some(({ utility }) => setsDuration(utility));
}

/**
 * Whether one class's compiled CSS animates the outline, read from its
 * declarations alone: what the browser would do with a card that has only
 * this class.
 */
function compiledAnimatesOutline(root: Root): boolean {
  const values = (property: string) => {
    const found: string[] = [];
    root.walkDecls(property, (decl) => {
      found.push(decl.value);
    });
    return found;
  };
  const includesOutline = (property: string) =>
    property === "all" ||
    property.startsWith("outline") ||
    property.startsWith("var(");
  const properties = values("transition-property");
  if (properties.length > 0) {
    return properties.some((list) =>
      list.split(",").some((property) => includesOutline(property.trim())),
    );
  }
  const shorthands = values("transition");
  if (shorthands.length > 0) {
    // A transition that names no property animates all of them.
    return shorthands.some((list) =>
      list.split(",").some((transition) => {
        const words = transition.trim().split(/\s+/);
        const property =
          words.find(
            (word) =>
              !/^[\d.]+m?s$/.test(word) &&
              !/^(ease|linear|step|cubic-bezier)/.test(word),
          ) ?? "all";
        return includesOutline(property);
      }),
    );
  }
  return values("transition-duration").some(
    (duration) => !/^0m?s$/.test(duration),
  );
}

/** Each class compiled alone by the site's Tailwind, without its other CSS. */
async function compileEach(classes: string[]): Promise<Root[]> {
  const website = path.resolve(__dirname, "../../..");
  return Promise.all(
    classes.map(async (className, i) => {
      const css = `@import "tailwindcss" prefix(tw) source(none);\n@source inline("${className}");`;
      // Tailwind's PostCSS plugin caches by file, so each compile gets its own.
      const from = path.join(website, `src/app/card-focus-probe-${i}.css`);
      const result = await postcss([
        tailwindcss({ base: website, optimize: false }),
      ]).process(css, { from });
      return result.root;
    }),
  );
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

      // outline-hidden sets outline-style: none as outline-none does, and
      // focus-visible:outline-2 keeps whichever style the card has.
      expect(
        classes.filter((name) => /outline-(none|hidden)$/.test(name)),
      ).toEqual([]);
      // The outline appears at once instead of animating in.
      expect(animatesOutline(classes)).toBe(false);
    }
  });

  test("a card animates its outline exactly when its transitions can include it", () => {
    const card = (...utilities: string[]) => utilities.map((u) => P + u);
    const animates = [
      card("transition"),
      card("transition-all"),
      card("transition-colors"),
      card("motion-safe:transition-all"),
      card("transition-[outline-color]"),
      card("transition-[box-shadow,all]"),
      card("transition-(--card-transition)"),
      card("[transition-property:outline-color]"),
      card("[transition:box-shadow_1s]"),
      // CSS's initial transition-property is `all`.
      card("duration-300", "ease-out"),
      card("[transition-duration:300ms]"),
      card("hover:transition-shadow", "duration-300"),
      card("transition-shadow", "focus-visible:transition-all"),
    ];
    const still = [
      card("transition-[box-shadow,translate]", "duration-300", "ease-out"),
      card("transition-shadow"),
      card("transition-transform", "duration-300"),
      card("transition-none", "duration-300"),
      card("[transition-property:box-shadow]", "duration-300"),
      card("duration-0"),
      card("ease-out", "delay-100"),
      card("transition-discrete"),
    ];
    expect(animates.filter((classes) => !animatesOutline(classes))).toEqual([]);
    expect(still.filter(animatesOutline)).toEqual([]);
  });

  // Differential: the rule against Tailwind's own output, one class at a time.
  // It never misses an animated outline, and it is exact except for transition
  // shorthands, which it always counts as animating.
  test("the transition rule agrees with Tailwind's compiled CSS for each class", async () => {
    const utilities = [
      "transition",
      "transition-all",
      "transition-colors",
      "transition-opacity",
      "transition-shadow",
      "transition-transform",
      "transition-none",
      "transition-discrete",
      "transition-normal",
      "transition-[box-shadow,translate]",
      "transition-[outline-color]",
      "transition-[box-shadow,all]",
      "transition-(--card-transition)",
      "duration-0",
      "duration-75",
      "duration-300",
      "duration-[250ms]",
      "duration-[0ms]",
      "duration-initial",
      "ease-out",
      "delay-100",
      "[transition-property:outline-color]",
      "[transition-property:box-shadow]",
      "[transition-duration:300ms]",
      "[transition-delay:1s]",
      "[transition:all_1s]",
      "[transition:box-shadow_1s]",
      "motion-safe:transition-all",
      "hover:duration-300",
      "focus-visible:transition-colors",
    ];
    const classes = utilities.map((u) => P + u);
    const roots = await compileEach(classes);
    const declaresTransition = (root: Root) => {
      let found = false;
      root.walkDecls(/^transition/, () => {
        found = true;
      });
      return found;
    };
    const compiled = classes.map((name, i) => ({
      name,
      rule: animatesOutline([name]),
      css: compiledAnimatesOutline(roots[i]),
      emitted: declaresTransition(roots[i]),
    }));
    // Every class but duration-initial, which only sets Tailwind's own
    // --tw-duration, compiled to a transition declaration.
    expect(compiled.filter((c) => !c.emitted).map((c) => c.name)).toEqual([
      P + "duration-initial",
    ]);
    expect(compiled.filter((c) => c.css && !c.rule)).toEqual([]);
    expect(compiled.filter((c) => c.rule !== c.css).map((c) => c.name)).toEqual(
      [P + "[transition:box-shadow_1s]"],
    );
  });
});

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
  const utility = (segments.pop() ?? "").replace(/^!|!$/g, "");
  return {
    variants: segments[0] === "tw" ? segments.slice(1) : segments,
    utility,
  };
}

/**
 * The transition-property names known to leave the outline out. Any other name
 * may include it: `all`, an `outline…` property, a variable, a CSS-wide
 * keyword (the property's initial value is `all`), or a name the browser
 * rejects, which drops the whole list.
 */
const SAFE_PROPERTIES = new Set([
  "box-shadow",
  "translate",
  "transform",
  "scale",
  "rotate",
  "opacity",
]);

/** Whether a name in a transition-property list can include the outline. */
function includesOutline(name: string): boolean {
  return !SAFE_PROPERTIES.has(name.trim().toLowerCase());
}

/**
 * Whether a transition-property list can include the outline. Only `none`, or
 * a comma-separated list of known properties, leaves it out: the browser drops
 * any other value, such as `box-shadow translate`, and keeps the initial `all`.
 */
function listsOutline(list: string): boolean {
  const names = list.replace(/_/g, " ").split(",");
  if (names.length === 1 && names[0].trim().toLowerCase() === "none") {
    return false;
  }
  return names.some(includesOutline);
}

/**
 * An arbitrary property as the browser reads it, from what Tailwind's compiler
 * emits when it's handed the class directly, as the differential below does.
 * The compiler emits one only when its name starts with `-` or a lower-case
 * letter, and keeps the rest of the name as written. The browser compares
 * property names case-insensitively and reads `-webkit-transition…` as
 * `transition…`. A name with a CSS escape, such as `transition\\-delay`, counts
 * as a `transition` shorthand. So does a transition property with any `/`
 * modifier: the compiler keeps the value as written when the modifier is 100%,
 * as in `[transition:all_1s]/100` or `/[1]`, and otherwise emits nothing or
 * mixes the value into a colour the browser rejects. A custom property is
 * never one.
 *
 * On the site, Tailwind's scanner finds the classes in source files, and it
 * extracts none of the mixed-case or escaped transition names tested here. So
 * there they compile to nothing, and reading them this way only over-counts.
 */
function arbitraryProperty(
  utility: string,
): { property: string; value: string } | undefined {
  const match = utility.match(/^\[([^:]+):(.*?)\](\/.+)?$/);
  if (!match || !/^[-a-z]/.test(match[1])) return undefined;
  const name = match[1].toLowerCase().replace(/^-webkit-/, "");
  const modified =
    match[3] !== undefined &&
    /^transition(-property|-duration|-delay)?$/.test(name);
  return {
    property:
      !name.startsWith("--") && (name.includes("\\") || modified)
        ? "transition"
        : name,
    value: match[2],
  };
}

/**
 * How a utility sets transition-property: to a list without the outline, to
 * one that may include it, or not at all. Tailwind's `transition`,
 * `transition-all` and `transition-colors` include outline-color. A
 * `transition` shorthand counts as unsafe, even one that names a safe
 * property.
 */
function setsTransition(utility: string): "safe" | "unsafe" | undefined {
  const arbitrary = arbitraryProperty(utility);
  if (arbitrary) {
    const { property, value } = arbitrary;
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

/**
 * Whether a utility sets a transition duration or delay other than zero.
 * Either can start a transition: CSS Transitions starts one when
 * max(duration, 0s) + delay is above zero, so a delay alone shows the outline
 * late. A negative delay counts too, which can only over-count.
 */
function setsTiming(utility: string): boolean {
  const arbitrary = arbitraryProperty(utility);
  const time = arbitrary
    ? /^transition-(duration|delay)$/.test(arbitrary.property)
      ? arbitrary.value
      : undefined
    : utility.match(/^(?:duration|delay)-(.+)$/)?.[1];
  return (
    time !== undefined &&
    time.toLowerCase() !== "initial" &&
    !/^\[?0(m?s)?\]?$/i.test(time)
  );
}

/**
 * Whether a card's classes animate its outline. CSS's initial
 * transition-property is `all`, so a duration or a delay animates the outline
 * unless a transition-property utility without a variant leaves it out.
 */
function animatesOutline(classes: string[]): boolean {
  const parsed = classes.map(parseClass);
  const sets = parsed.map(({ utility }) => setsTransition(utility));
  if (sets.includes("unsafe")) return true;
  const baseList = parsed.some(
    ({ variants }, i) => variants.length === 0 && sets[i] === "safe",
  );
  return !baseList && parsed.some(({ utility }) => setsTiming(utility));
}

/**
 * Whether one class's compiled CSS animates the outline, read from its
 * declarations alone: what the browser would do with a card that has only
 * this class.
 */
function compiledAnimatesOutline(root: Root): boolean {
  const values = (property: string) => {
    const found: string[] = [];
    root.walkDecls((decl) => {
      if (decl.prop.toLowerCase().replace(/^-webkit-/, "") === property) {
        found.push(decl.value);
      }
    });
    return found;
  };
  const properties = values("transition-property");
  if (properties.length > 0) {
    return properties.some(listsOutline);
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
  return [...values("transition-duration"), ...values("transition-delay")].some(
    (time) => !/^0m?s$/i.test(time),
  );
}

/**
 * Each class compiled alone by the site's Tailwind, without its other CSS. The
 * class is handed to the compiler directly, not found by the scanner.
 */
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
      // A delay starts a transition too, so the outline shows late.
      card("ease-out", "delay-100"),
      card("[transition-delay:50ms]"),
      // These mean the initial value, `all`.
      card("transition-[initial]"),
      card("[transition-property:unset]", "duration-300"),
      card("transition-[revert]", "duration-300"),
      card("transition-shadow", "focus-visible:transition-all"),
      card("transition-[box-shadow_translate]", "duration-300"),
      card("transition-[box-shadow,none]", "duration-300"),
      card("!transition-all"),
      card("!delay-100"),
      card("transition-[ALL]", "duration-300"),
      card("[-webkit-transition:all_300ms]"),
      card("[-webkit-transition-delay:100ms]"),
      // CSS units and property names in a list are case-insensitive.
      card("delay-[100MS]"),
      // Handed the class directly, the compiler keeps a name that starts
      // lower-case as written, and the browser reads it case-insensitively.
      // The site's scanner extracts none of these.
      card("ease-out", "[transition-Delay:100ms]"),
      card("[transition-Duration:300ms]"),
      card("[transitioN:all_300ms]"),
      card("[-WEBKIT-transition:all_300ms]"),
      card(
        "transition-[box-shadow,translate]",
        "duration-300",
        "[transition-Property:all]",
      ),
      card("ease-out", "[transition\\-delay:100ms]"),
      // A `/` modifier of 100% leaves an arbitrary property's value as written.
      card("[transition:all_1s]/100"),
      card(
        "transition-[box-shadow,translate]",
        "duration-300",
        "[transition-property:all]/100",
      ),
      card("ease-out", "[transition-delay:100ms]/100"),
      card("ease-out", "[transition-delay:100ms]/[1]"),
      // A modifier of 50 mixes the value into a colour, which the browser
      // rejects, keeping the initial `all`.
      card("[transition-property:box-shadow]/50", "duration-300"),
      // A variable modifier, even one with a fallback, keeps the value as
      // written and adds a mixed override.
      card(
        "transition-[box-shadow,translate]",
        "duration-300",
        "[transition-property:all]/(--x)",
      ),
      card(
        "transition-[box-shadow,translate]",
        "duration-300",
        "[transition-property:all]/(--x,var(--y))",
      ),
    ];
    const still = [
      card("transition-[box-shadow,translate]", "duration-300", "ease-out"),
      card("transition-shadow"),
      card("transition-transform", "duration-300"),
      card("transition-none", "duration-300"),
      card("[transition-property:box-shadow]", "duration-300"),
      card("duration-0"),
      card("duration-0", "delay-0"),
      card("ease-out"),
      card("transition-shadow", "delay-100"),
      card("transition-discrete"),
      card("transition-[BOX-SHADOW]", "duration-300"),
      card("[transition-duration:0MS]"),
      // The compiler emits nothing for a name that starts upper-case.
      card("[TRANSITION:all_1s]"),
      // A modifier on another arbitrary property sets no transition.
      card("[color:red]/50"),
      card("[--card\\.gap:1]"),
    ];
    expect(animates.filter((classes) => !animatesOutline(classes))).toEqual([]);
    expect(still.filter(animatesOutline)).toEqual([]);
  });

  // Differential: the rule against Tailwind's own output, one class at a time.
  // This checks how the rule reads each utility against what Tailwind compiles
  // it to. Which property names include the outline, and which timings start a
  // transition, are the same CSS rules in both. It never misses a class the
  // compiled CSS animates, and it is exact except for transition shorthands,
  // which it always counts as animating.
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
      "delay-0",
      "delay-100",
      "transition-[initial]",
      "transition-[inherit]",
      "[transition-property:unset]",
      "[transition-property:outline-color]",
      "transition-[box-shadow_translate]",
      "transition-[box-shadow,none]",
      "!transition-all",
      "!delay-100",
      "transition-[ALL]",
      "[-webkit-transition:all_300ms]",
      "[-webkit-transition-delay:100ms]",
      "transition-[BOX-SHADOW]",
      "delay-[100MS]",
      "[transition-duration:0MS]",
      "[TRANSITION:all_1s]",
      "[TRANSITION-DELAY:100ms]",
      "[Transition-Property:all]",
      "[transition-Delay:100ms]",
      "[transition-Property:all]",
      "[transitioN:all_1s]",
      "[-WEBKIT-transition:all_1s]",
      "[transition-property:box-shadow]",
      "[transition-duration:300ms]",
      "[transition-delay:1s]",
      "[transition:all_1s]",
      "[transition:box-shadow_1s]",
      "[transition:all_1s]/100",
      "[transition-property:all]/100",
      "motion-safe:transition-all",
      "hover:duration-300",
      "focus-visible:transition-colors",
    ];
    const classes = utilities.map((u) => P + u);
    const roots = await compileEach(classes);
    const declaresTransition = (root: Root) => {
      let found = false;
      root.walkDecls(/^(-webkit-)?transition/i, () => {
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
    // Every class compiled to a transition declaration but duration-initial,
    // which only sets Tailwind's own --tw-duration, and the arbitrary
    // properties whose names start upper-case, which the compiler drops.
    expect(compiled.filter((c) => !c.emitted).map((c) => c.name)).toEqual([
      P + "duration-initial",
      P + "[TRANSITION:all_1s]",
      P + "[TRANSITION-DELAY:100ms]",
      P + "[Transition-Property:all]",
    ]);
    expect(compiled.filter((c) => c.css && !c.rule)).toEqual([]);
    expect(compiled.filter((c) => c.rule !== c.css).map((c) => c.name)).toEqual(
      [P + "[transition:box-shadow_1s]"],
    );
  });
});

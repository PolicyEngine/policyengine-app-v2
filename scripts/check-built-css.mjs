#!/usr/bin/env node
// Checks a Next build's CSS against a fresh Tailwind compile of the same
// stylesheet: every class the fresh compile has must be in the built CSS, and
// the built CSS must have no Tailwind utility the fresh compile lacks. So a
// build that reused CSS from an older compile fails here once the source adds
// a class or drops a Tailwind utility. It compares class names only: stale CSS
// that differs only in values, such as a theme colour, passes, and so does one
// that keeps a hand-written class the source dropped. The website once
// shipped stale CSS: see the webpack note in website/next.config.ts.
//
// Usage: node scripts/check-built-css.mjs <appDir> <stylesheet> [cssDir]
//   appDir      the Next app, where `next build` ran (Tailwind scans from here)
//   stylesheet  the Tailwind entry, relative to appDir
//   cssDir      the built CSS, by default <appDir>/.next/static/css. Next
//               empties .next, except .next/cache, before each build, so it
//               holds only this build's files.
import { readdirSync, readFileSync, realpathSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Tailwind's utilities all carry this prefix in both apps' stylesheets. */
export const UTILITY_PREFIX = "tw:";

const HEX_DIGIT = /[0-9a-fA-F]/;
const WHITESPACE = /[ \t\n\r\f]/;

/**
 * Reads a CSS escape (CSS Syntax 4.3.7) starting at the backslash at `start`.
 * Returns the character it stands for and the index after it.
 */
function readEscape(text, start) {
  let i = start + 1;
  let hex = "";
  while (hex.length < 6 && i < text.length && HEX_DIGIT.test(text[i])) {
    hex += text[i++];
  }
  if (!hex) {
    const codePoint = text.codePointAt(i);
    if (codePoint === undefined) return ["\uFFFD", i];
    const char = String.fromCodePoint(codePoint);
    return [char, i + char.length];
  }
  // One whitespace character after a hex escape belongs to the escape.
  if (text[i] === "\r" && text[i + 1] === "\n") i += 2;
  else if (i < text.length && WHITESPACE.test(text[i])) i += 1;
  const codePoint = parseInt(hex, 16);
  const valid =
    codePoint !== 0 &&
    codePoint <= 0x10ffff &&
    !(codePoint >= 0xd800 && codePoint <= 0xdfff);
  return [valid ? String.fromCodePoint(codePoint) : "\uFFFD", i];
}

function isNameChar(char) {
  return /[A-Za-z0-9_-]/.test(char) || char.charCodeAt(0) >= 0x80;
}

/** A backslash starts an escape unless a newline follows it (CSS Syntax 4.3.8). */
function startsEscape(text, i) {
  return text[i] === "\\" && !/[\n\r\f]/.test(text[i + 1] ?? "");
}

/** The index just past the comment that opens at `start`, or the end. */
function skipComment(text, start) {
  const end = text.indexOf("*/", start + 2);
  return end === -1 ? text.length : end + 2;
}

/** The index just past the string whose quote is at `start`. */
function skipString(text, start) {
  let i = start + 1;
  while (i < text.length && text[i] !== text[start]) {
    i += text[i] === "\\" ? 2 : 1;
  }
  return i + 1;
}

/**
 * The class names a selector names, unescaped: `.tw\:mt-\[53px\]` names
 * `tw:mt-[53px]`. A dot inside a string, an escape or a comment isn't a class,
 * and an attribute value can only hold a dot in a string or an escape. PostCSS
 * keeps a comment between selector tokens, and Next's minifier keeps one that
 * opens with `/*!`.
 */
export function selectorClasses(selector) {
  const names = [];
  let i = 0;
  while (i < selector.length) {
    const char = selector[i];
    if (startsEscape(selector, i)) {
      i = readEscape(selector, i)[1];
    } else if (char === '"' || char === "'") {
      i = skipString(selector, i);
    } else if (char === "/" && selector[i + 1] === "*") {
      i = skipComment(selector, i);
    } else if (char === ".") {
      let name = "";
      i++;
      while (i < selector.length) {
        if (startsEscape(selector, i)) {
          const [escaped, next] = readEscape(selector, i);
          name += escaped;
          i = next;
        } else if (isNameChar(selector[i])) {
          name += selector[i++];
        } else break;
      }
      if (name) names.push(name);
    } else {
      i++;
    }
  }
  return names;
}

/** Every class a parsed stylesheet's rules name. Keyframe steps aren't rules. */
export function stylesheetClasses(root) {
  const names = new Set();
  root.walkRules((rule) => {
    if (
      rule.parent?.type === "atrule" &&
      /keyframes$/i.test(rule.parent.name)
    ) {
      return;
    }
    for (const name of selectorClasses(rule.selector)) names.add(name);
  });
  return names;
}

/**
 * How a build's classes differ from a fresh compile's.
 * - `missing`: in the fresh compile, not in the build. The build would ship
 *   pages whose classes do nothing.
 * - `staleUtilities`: Tailwind utilities in the build that the fresh compile
 *   lacks, so the build's CSS came from other source.
 * - `otherCss`: other classes only the build has, from stylesheets Tailwind
 *   doesn't compile, such as RichTextBlock.css. These are fine.
 */
export function compareClasses(fresh, built, prefix = UTILITY_PREFIX) {
  const onlyBuilt = [...built].filter((name) => !fresh.has(name)).sort();
  return {
    missing: [...fresh].filter((name) => !built.has(name)).sort(),
    staleUtilities: onlyBuilt.filter((name) => name.startsWith(prefix)),
    otherCss: onlyBuilt.filter((name) => !name.startsWith(prefix)),
  };
}

/**
 * PostCSS and Tailwind's PostCSS plugin, resolved from the app, as Next
 * resolves the plugin. Next runs it with its own PostCSS (8.4.31 in Next
 * 15.5.12); for both apps that gave the same CSS as the app's 8.5.6.
 */
function appTools(appDir) {
  const require = createRequire(path.join(appDir, "package.json"));
  return {
    postcss: require("postcss"),
    tailwind: require("@tailwindcss/postcss"),
  };
}

/**
 * Compiles the stylesheet the way the app's production build does: Tailwind
 * scanning from the app's directory, optimized. Tailwind's plugin optimizes
 * when NODE_ENV is production, as it is under `next build`. This process's
 * NODE_ENV is unset after `next build` and "test" under Vitest, so the option
 * is explicit: optimizing drops a rule Lightning CSS rejects, such as
 * `.x { color: red !ie }`, and so does the build.
 */
export async function freshClasses(appDir, stylesheet) {
  const { postcss, tailwind } = appTools(appDir);
  const from = path.resolve(appDir, stylesheet);
  const result = await postcss([
    tailwind({ base: appDir, optimize: true }),
  ]).process(readFileSync(from, "utf8"), { from, to: from });
  return stylesheetClasses(result.root);
}

function cssFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return cssFiles(full);
    return entry.name.endsWith(".css") ? [full] : [];
  });
}

export async function checkBuiltCss({
  appDir,
  stylesheet,
  cssDir = path.join(appDir, ".next/static/css"),
  prefix = UTILITY_PREFIX,
}) {
  const files = cssFiles(cssDir);
  if (files.length === 0) throw new Error(`No CSS files under ${cssDir}`);
  const { postcss } = appTools(appDir);
  const built = new Set(
    files.flatMap((file) => [
      ...stylesheetClasses(postcss.parse(readFileSync(file, "utf8"))),
    ]),
  );
  const fresh = await freshClasses(appDir, stylesheet);
  if (![...fresh].some((name) => name.startsWith(prefix))) {
    // Otherwise a compile that scanned nothing would pass any build.
    throw new Error(
      `A fresh compile of ${stylesheet} has no ${prefix} utilities`,
    );
  }
  return {
    files,
    fresh: fresh.size,
    built: built.size,
    ...compareClasses(fresh, built, prefix),
  };
}

function count(n, one, many) {
  return `${n} ${n === 1 ? one : many}`;
}

function list(names) {
  const shown = names.slice(0, 20).map((name) => `    ${name}`);
  if (names.length > 20) shown.push(`    and ${names.length - 20} more`);
  return shown.join("\n");
}

async function main([appArg, stylesheet, cssArg]) {
  if (!appArg || !stylesheet) {
    console.error(
      "Usage: node scripts/check-built-css.mjs <appDir> <stylesheet> [cssDir]",
    );
    return 2;
  }
  const appDir = path.resolve(appArg);
  const result = await checkBuiltCss({
    appDir,
    stylesheet,
    ...(cssArg ? { cssDir: path.resolve(cssArg) } : {}),
  });
  const relative = path.relative(process.cwd(), appDir);
  const where = relative.startsWith("..") ? appDir : relative || ".";
  if (result.missing.length === 0 && result.staleUtilities.length === 0) {
    console.log(
      `Built CSS for ${where} has all ${result.fresh} classes of a fresh compile of ${stylesheet}` +
        (result.otherCss.length
          ? `, plus ${result.otherCss.length} from other stylesheets.`
          : "."),
    );
    return 0;
  }
  console.error(
    `Built CSS for ${where} has different classes from a fresh compile of ${stylesheet}.`,
  );
  if (result.missing.length) {
    const what = count(
      result.missing.length,
      "class the source uses is",
      "classes the source uses are",
    );
    console.error(`  ${what} missing:\n${list(result.missing)}`);
  }
  if (result.staleUtilities.length) {
    const what = count(
      result.staleUtilities.length,
      "utility is",
      "utilities are",
    );
    console.error(
      `  ${what} in the build but not in the source:\n${list(result.staleUtilities)}`,
    );
  }
  console.error(
    "  The build most likely reused CSS from webpack's persistent cache. See the webpack note in website/next.config.ts.\n" +
      "  On Vercel, redeploy without the build cache. If the cache isn't the cause, look for another stylesheet that emits tw: classes.",
  );
  return 1;
}

/**
 * Whether Node ran this file as its entry. Node resolves symlinks in this
 * module's URL, unless --preserve-symlinks-main is set, but never in argv[1],
 * so this compares real paths; otherwise a run through a symlinked path would
 * exit 0 unchecked. Under `node -e` or `node -`, argv[1] is the first user
 * argument, which may name no file.
 */
function isEntry() {
  try {
    return (
      realpathSync(process.argv[1]) ===
      realpathSync(fileURLToPath(import.meta.url))
    );
  } catch {
    return false;
  }
}

if (isEntry()) {
  main(process.argv.slice(2)).then(
    (code) => process.exit(code),
    (error) => {
      console.error(error);
      process.exit(1);
    },
  );
}

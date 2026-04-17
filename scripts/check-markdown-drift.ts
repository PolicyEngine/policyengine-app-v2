#!/usr/bin/env tsx
/**
 * Guard against silent drift between the duplicated blog-markdown helpers.
 *
 * Pairs checked:
 *   1. app/src/components/blog/MarkdownFormatter.tsx (Vite / legacy)
 *      website/src/components/blog/MarkdownFormatter.tsx (Next.js)
 *   2. app/src/components/blog/safeHref.ts (Vite / legacy)
 *      website/src/components/blog/safeHref.ts (Next.js)
 *
 * These files were forked during the Next.js migration and have slowly
 * diverged. Several recent bugs (#981, #982, #988, #989) existed in one
 * copy and not the other. Until the two copies are deduplicated into a
 * shared package (tracked in a follow-up issue referenced in the PR that
 * added this script), this check tries to detect semantic drift — the
 * *set of exports and file-level declarations* — without being noisy
 * about whitespace, quote style, or prose comments.
 *
 * The script fails CI if the top-level API surface (exported or file-level
 * `function`/`const` declarations) diverges outside a known allow-list.
 *
 * Usage:
 *   bun run scripts/check-markdown-drift.ts
 *
 * Exit codes:
 *   0  No drift (or only allow-listed drift)
 *   1  Drift detected; prints a report
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

type DeclSet = Set<string>;

interface DriftPair {
  /** Short identifier used in log output. */
  label: string;
  /** Absolute path to the app/ copy. */
  appFile: string;
  /** Absolute path to the website/ copy. */
  websiteFile: string;
  /** Identifiers allowed to exist only in app/. */
  allowOnlyInApp: DeclSet;
  /** Identifiers allowed to exist only in website/. */
  allowOnlyInWebsite: DeclSet;
}

const PAIRS: DriftPair[] = [
  {
    label: "MarkdownFormatter",
    appFile: resolve(
      REPO_ROOT,
      "app/src/components/blog/MarkdownFormatter.tsx",
    ),
    websiteFile: resolve(
      REPO_ROOT,
      "website/src/components/blog/MarkdownFormatter.tsx",
    ),
    // Names that are allowed to exist in only one copy. Add entries here
    // when a genuine, intentional divergence is introduced; require a PR
    // comment explaining why the two files differ on this identifier.
    allowOnlyInApp: new Set<string>([
      // `useRobotoMonoFont` was introduced in the app/ copy only (#980).
      // The website/ copy relies on a global stylesheet import instead.
      "useRobotoMonoFont",
      // Internal helper constants/types only present in app/.
      "ROBOTO_MONO_HREF",
      // Type-guard helpers introduced by #988 to strip `as any` casts. The
      // website/ copy uses different source-level conventions and does not
      // need these helpers (its renderers already type-narrow inline).
      "isReactElement",
      "elementProps",
    ]),
    allowOnlyInWebsite: new Set<string>([
      // `Th` header cell component is only defined as a standalone export
      // in the website/ copy (app/ inlines it).
      "Th",
    ]),
  },
  {
    label: "safeHref",
    appFile: resolve(REPO_ROOT, "app/src/components/blog/safeHref.ts"),
    websiteFile: resolve(REPO_ROOT, "website/src/components/blog/safeHref.ts"),
    allowOnlyInApp: new Set<string>(),
    allowOnlyInWebsite: new Set<string>(),
  },
];

/** Extract top-level `export`/`function`/`const`/`class` identifiers. */
function extractTopLevelDecls(source: string): DeclSet {
  const decls: DeclSet = new Set();
  const patterns = [
    /^export\s+function\s+([A-Za-z_][A-Za-z0-9_]*)/gm,
    /^export\s+const\s+([A-Za-z_][A-Za-z0-9_]*)/gm,
    /^export\s+class\s+([A-Za-z_][A-Za-z0-9_]*)/gm,
    /^function\s+([A-Za-z_][A-Za-z0-9_]*)/gm,
    /^const\s+([A-Za-z_][A-Za-z0-9_]*)\s*=/gm,
  ];
  for (const re of patterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(source)) !== null) {
      decls.add(m[1]);
    }
  }
  return decls;
}

function checkPair(pair: DriftPair): number {
  const appSrc = readFileSync(pair.appFile, "utf8");
  const webSrc = readFileSync(pair.websiteFile, "utf8");

  const appDecls = extractTopLevelDecls(appSrc);
  const webDecls = extractTopLevelDecls(webSrc);

  const onlyInApp = [...appDecls]
    .filter((d) => !webDecls.has(d) && !pair.allowOnlyInApp.has(d))
    .sort();
  const onlyInWeb = [...webDecls]
    .filter((d) => !appDecls.has(d) && !pair.allowOnlyInWebsite.has(d))
    .sort();

  if (onlyInApp.length === 0 && onlyInWeb.length === 0) {
    console.log(
      `${pair.label} drift check: PASS (top-level API in sync).`,
    );
    return 0;
  }

  console.error(`${pair.label} drift check: FAIL`);
  console.error("");
  console.error(
    `The two ${pair.label} copies have diverged in their top-level`,
  );
  console.error(
    "API surface. Either port the change to the other file, or add the",
  );
  console.error(
    "identifier to the pair's allow-list in",
  );
  console.error("scripts/check-markdown-drift.ts with a comment explaining why.");
  console.error("");
  if (onlyInApp.length > 0) {
    console.error("Only in app/:");
    for (const name of onlyInApp) {
      console.error(`  - ${name}`);
    }
  }
  if (onlyInWeb.length > 0) {
    console.error("Only in website/:");
    for (const name of onlyInWeb) {
      console.error(`  - ${name}`);
    }
  }
  return 1;
}

function main(): number {
  let exitCode = 0;
  for (const pair of PAIRS) {
    if (checkPair(pair) !== 0) {
      exitCode = 1;
    }
  }
  return exitCode;
}

process.exit(main());

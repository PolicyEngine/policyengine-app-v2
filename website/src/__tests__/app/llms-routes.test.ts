import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, test } from "vitest";

import * as fullRoute from "@/app/llms-full.txt/route";
import * as recentRoute from "@/app/llms-recent.txt/route";
import * as ukRoute from "@/app/llms-research-uk.txt/route";
import * as usRoute from "@/app/llms-research-us.txt/route";
import * as indexRoute from "@/app/llms.txt/route";
import sitemap from "@/app/sitemap";
import { getPostsSorted } from "@/data/posts/postTransformers";
import { getAllSlugs } from "@/lib/articles";
import { VALID_COUNTRIES } from "@/lib/countries";
import {
  INDEX_RECENT_COUNT,
  LLMS_FILE_NAMES,
  RECENT_ARCHIVE_COUNT,
  SITE_URL,
  buildLlmsFile,
  postUrl,
  type LlmsFileName,
} from "@/lib/llmsTxt";

const ROUTES: Record<LlmsFileName, { GET: () => Response; dynamic: string }> = {
  "llms.txt": indexRoute,
  "llms-recent.txt": recentRoute,
  "llms-research-us.txt": usRoute,
  "llms-research-uk.txt": ukRoute,
  "llms-full.txt": fullRoute,
};

const WEBSITE_ROOT = join(__dirname, "../../..");
const CODE_FENCE = /^[ \t]*```[^\n]*\n[\s\S]*?^[ \t]*```[ \t]*\r?$/gm;

function urlLines(text: string): string[] {
  return [...text.matchAll(/^URL: (.+)$/gm)].map((m) => m[1]);
}

const files = {} as Record<LlmsFileName, string>;

beforeAll(() => {
  for (const name of LLMS_FILE_NAMES) files[name] = buildLlmsFile(name);
});

describe("llms route handlers", () => {
  test.each(LLMS_FILE_NAMES)(
    "given GET /%s then it returns the built file as UTF-8 text",
    async (name) => {
      // When
      const response = ROUTES[name].GET();

      // Then
      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe(
        "text/plain; charset=utf-8",
      );
      expect(await response.text()).toBe(files[name]);
    },
  );

  test.each(LLMS_FILE_NAMES)(
    "given the /%s route then it is built once, with the site",
    (name) => {
      expect(ROUTES[name].dynamic).toBe("force-static");
      expect(existsSync(join(WEBSITE_ROOT, "src/app", name, "route.ts"))).toBe(
        true,
      );
    },
  );

  // Next.js fails the build when a public file and a route share a path.
  test("given website/public then no llms file shadows a route", () => {
    const publicFiles = readdirSync(join(WEBSITE_ROOT, "public"));
    expect(publicFiles.filter((f) => /^llms.*\.txt$/.test(f))).toEqual([]);
  });
});

describe("llms.txt index", () => {
  test("given the index then it follows the llmstxt.org layout", () => {
    const lines = files["llms.txt"].split("\n");

    expect(lines[0]).toBe("# PolicyEngine");
    expect(lines[2]).toMatch(/^> \S/);
    expect(lines.filter((l) => l.startsWith("# "))).toHaveLength(1);

    // Under each H2, every list item is "- [name](url)" with optional notes.
    const firstSection = lines.findIndex((l) => l.startsWith("## "));
    const items = lines.slice(firstSection).filter((l) => l.startsWith("- "));
    expect(items.length).toBeGreaterThan(INDEX_RECENT_COUNT);
    for (const item of items) {
      expect(item).toMatch(
        /^- \[(?:[^\]\\]|\\.)+\]\((?:https:|mailto:)[^)\s]+\)(?:: .+)?$/,
      );
    }
  });

  test("given the index then it lists the newest research as the research page does", () => {
    const listed = [
      ...files["llms.txt"]
        .split("## Research by country")[0]
        .matchAll(/^- \[.+\]\((\S+)\): /gm),
    ].map((m) => m[1]);

    expect(listed).toEqual(
      getPostsSorted().slice(0, INDEX_RECENT_COUNT).map(postUrl),
    );
  });

  test("given the index then every llms file it links is served", () => {
    const linked = [
      ...files["llms.txt"].matchAll(
        new RegExp(
          `\\(${SITE_URL.replace(/\./g, "\\.")}/(llms[^)]*\\.txt)\\)`,
          "g",
        ),
      ),
    ].map((m) => m[1]);

    expect([...linked].sort()).toEqual(
      LLMS_FILE_NAMES.filter((n) => n !== "llms.txt").sort(),
    );
  });

  test("given the index then its counts match the files", () => {
    const index = files["llms.txt"];
    const count = (name: LlmsFileName) => urlLines(files[name]).length;

    expect(index).toContain(
      `Full text of ${count("llms-research-us.txt")} articles on US`,
    );
    expect(index).toContain(
      `Full text of ${count("llms-research-uk.txt")} articles on UK`,
    );
    expect(index).toContain(
      `Full text of the ${count("llms-recent.txt")} most recent articles`,
    );
    expect(index).toContain(
      `Full text of all ${count("llms-full.txt")} PolicyEngine research articles`,
    );
  });
});

describe("llms article files from the real posts", () => {
  const posts = getPostsSorted();

  test("given the full archive then it holds every post once, in research-page order", () => {
    expect(urlLines(files["llms-full.txt"])).toEqual(posts.map(postUrl));
  });

  test("given the country files then each holds exactly its tagged posts", () => {
    for (const country of ["us", "uk"] as const) {
      expect(urlLines(files[`llms-research-${country}.txt`])).toEqual(
        posts.filter((p) => p.tags.includes(country)).map(postUrl),
      );
    }
  });

  test("given the recent file then it is the newest articles of the full archive", () => {
    const recent = files["llms-recent.txt"];
    const full = files["llms-full.txt"];
    const articlesOf = (text: string) => text.slice(text.indexOf("\n---\n"));

    expect(urlLines(recent)).toHaveLength(
      Math.min(RECENT_ARCHIVE_COUNT, posts.length),
    );
    expect(articlesOf(full).startsWith(articlesOf(recent))).toBe(true);
    expect(recent.length).toBeLessThan(full.length);
  });

  test("given every article URL then it is a page the site builds", () => {
    const slugs = new Set(getAllSlugs());
    const sitemapUrls = new Set(sitemap().map((entry) => entry.url));

    for (const url of urlLines(files["llms-full.txt"])) {
      const match = new RegExp(
        `^${SITE_URL.replace(/\./g, "\\.")}/([a-z]+)/research/([^/]+)$`,
      ).exec(url);
      expect(match, url).not.toBeNull();
      const [, country, slug] = match!;
      expect(VALID_COUNTRIES as readonly string[]).toContain(country);
      expect(slugs.has(slug), url).toBe(true);
      // The sitemap lists US and UK posts under each of their countries.
      if (country === "us" || country === "uk") {
        expect(sitemapUrls.has(url), url).toBe(true);
      }
    }
  });

  test("given every article then its dates run newest first", () => {
    const dates = [...files["llms-full.txt"].matchAll(/^Date: (.+)$/gm)].map(
      (m) => m[1],
    );
    expect(dates).toHaveLength(posts.length);
    for (const date of dates) expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    for (let i = 1; i < dates.length; i++) {
      expect(dates[i] <= dates[i - 1]).toBe(true);
    }
  });

  test.each([
    "llms-recent.txt",
    "llms-research-us.txt",
    "llms-research-uk.txt",
    "llms-full.txt",
  ] as const)(
    "given %s then no chart JSON, notebook JSON, embed or relative link is left",
    (name) => {
      const text = files[name];
      const prose = text.replace(CODE_FENCE, "");

      expect(text).not.toContain("```plotly");
      expect(text).not.toMatch(/"cell_type"\s*:/);
      expect(text).not.toContain("application/vnd.plotly.v1+json");
      expect(prose).not.toMatch(/<iframe|<script/i);
      expect(prose).not.toMatch(/\]\(\s*<?\/(?!\/)/);
      expect(prose).not.toMatch(/\s(?:src|href)\s*=\s*["']\/(?!\/)/i);
      for (const line of text
        .split("\n")
        .filter((l) => l.startsWith("[Chart: "))) {
        expect(line).toMatch(/^\[Chart: [^\n]*\]$/);
      }
    },
  );

  test("given notebook posts then their text and tables come through", () => {
    const full = files["llms-full.txt"];
    const notebookPosts = posts.filter((p) => p.filename.endsWith(".ipynb"));
    expect(notebookPosts.length).toBeGreaterThan(0);

    for (const post of notebookPosts) {
      const start = full.indexOf(`URL: ${postUrl(post)}\n`);
      const end = full.indexOf("\n---\n# ", start);
      const body = full.slice(start, end === -1 ? undefined : end);
      expect(body.length, post.filename).toBeGreaterThan(500);
    }

    const utah = posts.find((p) => p.slug === "utah-income-tax-changes")!;
    const utahStart = full.indexOf(`URL: ${postUrl(utah)}\n`);
    const utahBody = full.slice(
      utahStart,
      full.indexOf("\n---\n# ", utahStart),
    );
    expect(utahBody).toContain("Key results for 2025");
    expect(utahBody).toContain("| Single, No Children, $50,000");
    expect(utahBody).toContain(
      "[Chart: Figure 1: Change in Net Income for a Single Parent of a 5 year old;",
    );
  });

  test("given every article then its body is not empty", () => {
    const blocks = files["llms-full.txt"].split(/^(?=---\n# )/m).slice(1);
    expect(blocks).toHaveLength(posts.length);
    for (const block of blocks) {
      const body = block.split("\n---\n")[1] ?? "";
      expect(body.trim().length, block.slice(0, 80)).toBeGreaterThan(0);
    }
  });
});

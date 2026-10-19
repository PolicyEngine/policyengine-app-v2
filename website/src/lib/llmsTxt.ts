/**
 * llms.txt and its companion files (https://llmstxt.org).
 *
 * - /llms.txt: an index of PolicyEngine research and documentation.
 * - /llms-recent.txt: the full text of the 50 most recent articles.
 * - /llms-research-us.txt and /llms-research-uk.txt: every US or UK article.
 * - /llms-full.txt: every article.
 *
 * The article files hold each post as markdown. Plotly charts become one-line
 * summaries, iframes become links, scripts are dropped and site-relative
 * links become absolute. Notebook posts become the markdown the article page
 * renders: markdown cells plus the first output of each code cell.
 *
 * The force-static route handlers in src/app/llms*.txt/ serve these, so the
 * files are built with the site from posts.json, authors.json and the
 * article files.
 */

import authorsData from "@/data/posts/authors.json";
import {
  getPostCountryId,
  getPostsSorted,
} from "@/data/posts/postTransformers";
import { getArticleContent } from "@/lib/articles";
import { parseJSONSafe } from "@/lib/notebookUtils";
import { toPostIsoDate } from "@/lib/postDate";
import type {
  AuthorsCollection,
  BlogPost,
  Notebook,
  NotebookCell,
} from "@/types/blog";

export const SITE_URL = "https://www.policyengine.org";

export const LLMS_FILE_NAMES = [
  "llms.txt",
  "llms-recent.txt",
  "llms-research-us.txt",
  "llms-research-uk.txt",
  "llms-full.txt",
] as const;

export type LlmsFileName = (typeof LLMS_FILE_NAMES)[number];

/** Posts listed in the llms.txt index. */
export const INDEX_RECENT_COUNT = 10;
/** Posts in llms-recent.txt. */
export const RECENT_ARCHIVE_COUNT = 50;

export type LlmsPost = Pick<
  BlogPost,
  "title" | "description" | "date" | "authors" | "tags" | "filename" | "slug"
>;

/** What the files are built from. Tests pass their own. */
export interface LlmsSource {
  posts: readonly LlmsPost[];
  authors: Record<string, { name: string } | undefined>;
  loadArticle: (filename: string) => string;
}

export function defaultLlmsSource(): LlmsSource {
  return {
    posts: getPostsSorted(),
    authors: authorsData as AuthorsCollection,
    loadArticle: getArticleContent,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Collapse whitespace runs, for chart and iframe labels. */
function oneLine(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/** Join lines with a space, keeping other characters (such as NBSP) as written. */
function singleLine(text: string): string {
  return text.replace(/[ \t]*[\r\n\v\f\u0085\u2028\u2029]+[ \t]*/g, " ").trim();
}

/** Markdown link text, with its brackets and backslashes escaped. */
function linkText(text: string): string {
  return singleLine(text).replace(/[\\[\]]/g, "\\$&");
}

export function absoluteUrl(url: string): string {
  return url.startsWith("/") && !url.startsWith("//") ? SITE_URL + url : url;
}

export function postUrl(post: Pick<LlmsPost, "slug" | "tags">): string {
  return `${SITE_URL}/${getPostCountryId(post)}/research/${post.slug}`;
}

/* ------------------------------------------------------------------ */
/*  Charts                                                             */
/* ------------------------------------------------------------------ */

/** A Plotly title is a string or { text }, and may carry HTML tags. */
function plotlyText(value: unknown): string | undefined {
  const raw =
    typeof value === "string"
      ? value
      : isRecord(value) && typeof value.text === "string"
        ? value.text
        : undefined;
  if (raw === undefined) return undefined;
  const text = oneLine(
    raw.replace(/<br\s*\/?>/gi, " ").replace(/<[^>]*>/g, ""),
  );
  return text || undefined;
}

const MAX_SERIES_NAMES = 10;

/**
 * Summarise a Plotly figure in one line: its title, axis titles, trace types
 * and series names, whichever it has.
 */
export function summarizePlotlyFigure(figure: unknown): string {
  const parts: string[] = [];
  if (isRecord(figure)) {
    const layout = isRecord(figure.layout) ? figure.layout : {};
    const title = plotlyText(layout.title);
    if (title) parts.push(title);
    for (const axis of ["xaxis", "yaxis"] as const) {
      const axisLayout = layout[axis];
      const axisTitle = isRecord(axisLayout)
        ? plotlyText(axisLayout.title)
        : undefined;
      if (axisTitle) parts.push(`${axis[0]}-axis: ${axisTitle}`);
    }
    const traces = Array.isArray(figure.data)
      ? figure.data.filter(isRecord)
      : [];
    const types = [
      ...new Set(
        traces
          .map((trace) => trace.type)
          .filter((type): type is string => typeof type === "string"),
      ),
    ];
    if (types.length > 0) parts.push(`type: ${types.join(", ")}`);
    const names = [
      ...new Set(
        traces
          .map((trace) => plotlyText(trace.name))
          .filter((name): name is string => name !== undefined),
      ),
    ];
    if (names.length > 0) {
      const shown = names.slice(0, MAX_SERIES_NAMES).join(", ");
      const more = names.length - MAX_SERIES_NAMES;
      parts.push(`series: ${shown}${more > 0 ? ` and ${more} more` : ""}`);
    }
  }
  return parts.length > 0
    ? `[Chart: ${parts.join("; ")}]`
    : "[Chart: see the original article]";
}

function summarizePlotlyJson(raw: string): string {
  try {
    return summarizePlotlyFigure(JSON.parse(raw));
  } catch {
    return summarizePlotlyFigure(undefined);
  }
}

/* ------------------------------------------------------------------ */
/*  Markdown                                                           */
/* ------------------------------------------------------------------ */

/** A ```plotly fence; either fence line may be indented or end in spaces. */
const PLOTLY_FENCE =
  /^[ \t]*```plotly[ \t]*\r?\n([\s\S]*?)^[ \t]*```[ \t]*\r?$/gm;
/** Any other fenced code block, left as written. */
const CODE_FENCE = /^[ \t]*```[^\n]*\n[\s\S]*?^[ \t]*```[ \t]*\r?$/gm;
const SCRIPT_OR_STYLE = /<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi;
/** An iframe and its fallback content, stopping before any later iframe. */
const CLOSED_IFRAME =
  /<iframe\b([^>]*)>(?:(?!<iframe\b)[\s\S])*?<\/iframe\s*>/gi;
/** A self-closing or unclosed iframe tag. */
const BARE_IFRAME = /<iframe\b([^>]*)>/gi;
const HTML_ATTRIBUTE = /(?:^|\s)([a-z-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;
const RELATIVE_MARKDOWN_LINK = /(\]\(\s*<?)\/(?!\/)/g;
const RELATIVE_REFERENCE_LINK = /^([ \t]*\[[^\]\n]+\]:[ \t]*<?)\/(?!\/)/gm;
const RELATIVE_HTML_URL = /(\s(?:src|href)\s*=\s*["'])\/(?!\/)/gi;

function iframeAttributes(attributes: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const match of attributes.matchAll(HTML_ATTRIBUTE)) {
    result[match[1].toLowerCase()] = match[2] ?? match[3] ?? "";
  }
  return result;
}

/** "[Interactive: title](src)", naming it from its URL when it has no title. */
export function describeIframe(attributes: string): string {
  const { src = "", title = "" } = iframeAttributes(attributes);
  const lastSegment =
    src
      .split(/[?#]/)[0]
      .split("/")
      .filter(Boolean)
      .pop()
      ?.replace(/\.html?$/i, "") ?? "";
  const name =
    oneLine(title) ||
    oneLine(lastSegment.replace(/[-_]/g, " ")) ||
    "see the original article";
  return src.trim()
    ? `[Interactive: ${name}](${absoluteUrl(src.trim())})`
    : `[Interactive: ${name}]`;
}

/** Changes that apply only outside fenced code blocks. */
function transformProse(text: string): string {
  return text
    .replace(SCRIPT_OR_STYLE, "")
    .replace(CLOSED_IFRAME, (_, attributes: string) =>
      describeIframe(attributes),
    )
    .replace(BARE_IFRAME, (_, attributes: string) =>
      describeIframe(attributes.replace(/\/\s*$/, "")),
    )
    .replace(RELATIVE_MARKDOWN_LINK, `$1${SITE_URL}/`)
    .replace(RELATIVE_REFERENCE_LINK, `$1${SITE_URL}/`)
    .replace(RELATIVE_HTML_URL, `$1${SITE_URL}/`);
}

/** Apply `transform` to the text outside fenced code blocks. */
function outsideCodeFences(
  markdown: string,
  transform: (text: string) => string,
): string {
  let result = "";
  let last = 0;
  for (const match of markdown.matchAll(CODE_FENCE)) {
    result += transform(markdown.slice(last, match.index)) + match[0];
    last = match.index + match[0].length;
  }
  return result + transform(markdown.slice(last));
}

/** Turn article markdown into the text the llms files carry. */
export function transformArticleMarkdown(markdown: string): string {
  const withChartSummaries = markdown.replace(PLOTLY_FENCE, (_, json: string) =>
    summarizePlotlyJson(json.trim()),
  );
  return outsideCodeFences(withChartSummaries, transformProse);
}

/* ------------------------------------------------------------------ */
/*  Notebooks                                                          */
/* ------------------------------------------------------------------ */

function joinSource(source: unknown): string {
  if (typeof source === "string") return source;
  if (Array.isArray(source)) return source.join("");
  return "";
}

function plainTextOutput(text: string): string | null {
  let value: unknown;
  try {
    value = parseJSONSafe(text);
  } catch {
    return text.trim() ? "```\n" + text.trim() + "\n```" : null;
  }
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }
  if (isRecord(value) && Array.isArray(value.data)) {
    return summarizePlotlyFigure(value);
  }
  return "```json\n" + JSON.stringify(value, null, 2) + "\n```";
}

/**
 * The markdown for a code cell: its first output, which is the only one the
 * article page renders. HTML outputs are skipped, as on the page.
 */
function codeCellMarkdown(cell: NotebookCell): string | null {
  const data = cell.outputs?.[0]?.data;
  if (!data) return null;
  const plotly = data["application/vnd.plotly.v1+json"];
  if (plotly) return summarizePlotlyFigure(plotly);
  if (data["text/markdown"]) return joinSource(data["text/markdown"]);
  if (data["text/html"]) return null;
  if (data["text/plain"])
    return plainTextOutput(joinSource(data["text/plain"]));
  return null;
}

export function notebookToMarkdown(notebook: Notebook): string {
  const blocks: string[] = [];
  for (const cell of notebook.cells ?? []) {
    const block =
      cell.cell_type === "markdown"
        ? joinSource(cell.source)
        : cell.cell_type === "code"
          ? codeCellMarkdown(cell)
          : null;
    if (block?.trim()) blocks.push(block.trim());
  }
  return blocks.join("\n\n");
}

/** The llms text of one article file, markdown or notebook. */
export function articleToLlmsMarkdown(filename: string, raw: string): string {
  const markdown = filename.endsWith(".ipynb")
    ? notebookToMarkdown(JSON.parse(raw) as Notebook)
    : raw;
  return transformArticleMarkdown(markdown).trim();
}

/* ------------------------------------------------------------------ */
/*  Files                                                              */
/* ------------------------------------------------------------------ */

/** Newest first; the sort is stable, so posts with equal dates keep order. */
function newestFirst<T extends { date: string }>(posts: readonly T[]): T[] {
  return [...posts].sort((a, b) =>
    a.date < b.date ? 1 : a.date > b.date ? -1 : 0,
  );
}

export function formatArticle(
  post: LlmsPost,
  body: string,
  authors: LlmsSource["authors"],
): string {
  const authorNames = post.authors
    .map((id) => authors[id]?.name ?? id)
    .join(", ");
  return [
    "---",
    `# ${singleLine(post.title)}`,
    `URL: ${postUrl(post)}`,
    `Date: ${toPostIsoDate(post.date, "date")}`,
    `Authors: ${singleLine(authorNames)}`,
    `Tags: ${post.tags.join(", ")}`,
    `Description: ${singleLine(post.description)}`,
    "---",
    "",
    body,
    "",
  ].join("\n");
}

function buildArchive(
  title: string,
  summary: string,
  posts: readonly LlmsPost[],
  source: LlmsSource,
): string {
  const articles = posts.map((post) =>
    formatArticle(
      post,
      articleToLlmsMarkdown(post.filename, source.loadArticle(post.filename)),
      source.authors,
    ),
  );
  return [`# ${title}`, "", `> ${summary}`, "", ...articles].join("\n");
}

function postsTagged(posts: readonly LlmsPost[], tag: string): LlmsPost[] {
  return posts.filter((post) => post.tags.includes(tag));
}

function buildIndex(posts: readonly LlmsPost[]): string {
  const recent = posts
    .slice(0, INDEX_RECENT_COUNT)
    .map(
      (post) =>
        `- [${linkText(post.title)}](${postUrl(post)}): ${singleLine(post.description)}`,
    );
  const usCount = postsTagged(posts, "us").length;
  const ukCount = postsTagged(posts, "uk").length;

  return `# PolicyEngine

> PolicyEngine is a free, open-source tool for analyzing tax and benefit policy impacts through microsimulation modeling. We provide household calculators and society-wide impact analysis for the US and UK.

PolicyEngine enables users to:

- Calculate how policy changes affect individual households
- Estimate society-wide impacts on revenue, poverty, and inequality
- Compare reform proposals across different scenarios
- Access programmatic policy analysis via API

## Recent research

${recent.join("\n")}

## Research by country

- [US research](${SITE_URL}/llms-research-us.txt): Full text of ${usCount} articles on US federal and state policy
- [UK research](${SITE_URL}/llms-research-uk.txt): Full text of ${ukCount} articles on UK tax and benefit policy

## Full text

- [Recent articles](${SITE_URL}/llms-recent.txt): Full text of the ${Math.min(RECENT_ARCHIVE_COUNT, posts.length)} most recent articles
- [All research](${SITE_URL}/llms-full.txt): Full text of all ${posts.length} PolicyEngine research articles
- [Research library](${SITE_URL}/us/research): Browse and search research on the website

## Documentation

- [US household API](${SITE_URL}/us/api): Documentation for the PolicyEngine household API for US households
- [UK household API](${SITE_URL}/uk/api): Documentation for the PolicyEngine household API for UK households
- [Python package](${SITE_URL}/us/python): Documentation for the policyengine Python package, with US examples (UK examples at ${SITE_URL}/uk/python)
- [Model documentation](${SITE_URL}/us/model): The rules, parameters, variables and data behind PolicyEngine's US model (UK at ${SITE_URL}/uk/model)
- [AI agent skills](${SITE_URL}/us/ai-agents): Policy analysis with AI agents and PolicyEngine

## Contact

- [Website](${SITE_URL})
- [GitHub](https://github.com/PolicyEngine): Source code for PolicyEngine's models, data and apps
- [Email](mailto:hello@policyengine.org): hello@policyengine.org
`;
}

/** Build one of the llms files. */
export function buildLlmsFile(
  name: LlmsFileName,
  source: LlmsSource = defaultLlmsSource(),
): string {
  const posts = newestFirst(source.posts);
  switch (name) {
    case "llms.txt":
      return buildIndex(posts);
    case "llms-recent.txt": {
      const recent = posts.slice(0, RECENT_ARCHIVE_COUNT);
      return buildArchive(
        "PolicyEngine recent research",
        `The ${recent.length} most recent PolicyEngine research articles.`,
        recent,
        source,
      );
    }
    case "llms-research-us.txt":
      return buildArchive(
        "PolicyEngine US research",
        "US federal and state tax and benefit policy analysis.",
        postsTagged(posts, "us"),
        source,
      );
    case "llms-research-uk.txt":
      return buildArchive(
        "PolicyEngine UK research",
        "UK tax and benefit policy analysis.",
        postsTagged(posts, "uk"),
        source,
      );
    case "llms-full.txt":
      return buildArchive(
        "PolicyEngine research archive",
        "Every PolicyEngine research article.",
        posts,
        source,
      );
  }
}

/** The response each llms route handler returns. */
export function llmsTextResponse(name: LlmsFileName): Response {
  return new Response(buildLlmsFile(name), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control":
        "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
    },
  });
}

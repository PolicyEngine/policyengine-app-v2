/**
 * llms.txt and its companion files (https://llmstxt.org).
 *
 * - /llms.txt: an index of PolicyEngine research and documentation.
 * - /llms-recent.txt: the full text of the 50 most recent articles.
 * - /llms-research-us.txt and /llms-research-uk.txt: every US or UK article.
 * - /llms-full.txt: every article.
 *
 * The article files hold each post as markdown, in the research page's
 * order. Plotly charts become one-line summaries, iframes become links,
 * scripts and HTML comments are dropped, and relative links resolve against
 * the article's URL, as they do on its page. Fenced code is left as written.
 * Notebook posts become the markdown the article page renders: markdown cells
 * plus the first output of each code cell.
 *
 * The force-static route handlers in src/app/llms*.txt/ serve these, so the
 * files are built with the site from posts.json, authors.json and the
 * article files.
 */

import authorsData from "@/data/posts/authors.json";
import {
  compareNewestFirst,
  getPostCountryId,
  getPostsSorted,
  getResearchItems,
} from "@/data/posts/postTransformers";
import { getArticleContent } from "@/lib/articles";
import { decode, parseJSONSafe } from "@/lib/notebookUtils";
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

/** The posts in the order the research page lists them. */
function postsInResearchPageOrder(): BlogPost[] {
  const bySlug = new Map(getPostsSorted().map((post) => [post.slug, post]));
  return getResearchItems()
    .filter((item) => !item.isApp)
    .map((item) => bySlug.get(item.slug)!);
}

export function defaultLlmsSource(): LlmsSource {
  return {
    posts: postsInResearchPageOrder(),
    authors: authorsData as AuthorsCollection,
    loadArticle: getArticleContent,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Collapse whitespace runs (\s misses U+0085), for chart and iframe labels. */
function oneLine(text: string): string {
  return text.replace(/[\s\u0085]+/g, " ").trim();
}

/** Join lines with a space, keeping other characters (such as NBSP) as written. */
function singleLine(text: string): string {
  return text.replace(/[ \t]*[\r\n\v\f\u0085\u2028\u2029]+[ \t]*/g, " ").trim();
}

/** Markdown link text, with its brackets and backslashes escaped. */
function linkText(text: string): string {
  return singleLine(text).replace(/[\\[\]]/g, "\\$&");
}

const URL_SCHEME = /^[a-z][a-z0-9+.-]*:/i;

/**
 * Resolve a link target the way a browser on `base` would, so links still
 * work when read from /llms-full.txt. Absolute and protocol-relative URLs,
 * fragments and empty targets are returned unchanged.
 */
export function absoluteUrl(
  url: string,
  base: string = `${SITE_URL}/`,
): string {
  if (!url || url.startsWith("#") || url.startsWith("//")) return url;
  if (URL_SCHEME.test(url)) return url;
  try {
    return new URL(url, base).toString();
  } catch {
    return url;
  }
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
    decode(raw)
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<[^>]*>/g, ""),
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
          .map((trace) =>
            typeof trace.type === "string" ? oneLine(trace.type) : "",
          )
          .filter(Boolean),
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

/**
 * A fenced code block, as CommonMark reads one: three or more backticks or
 * tildes, closed by a line of at least as many of the same character, or by
 * the end of the document. Groups: fence, fence character, info, body.
 */
export const CODE_FENCE =
  /^[ \t]*((`|~)\2{2,})([^\n]*)\n([\s\S]*?)(?:^[ \t]*\1\2*[ \t]*\r?$|(?![\s\S]))/gm;
const INLINE_CODE = /`[^`\n]+`/g;
const HTML_COMMENT = /<!--[\s\S]*?-->/g;
const SCRIPT_OR_STYLE = /<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi;
/** An iframe and its fallback content, stopping before any later iframe. */
const CLOSED_IFRAME =
  /<iframe\b([^>]*)>(?:(?!<iframe\b)[\s\S])*?<\/iframe\s*>/gi;
/** A self-closing or unclosed iframe tag. */
const BARE_IFRAME = /<iframe\b([^>]*)>/gi;
const HTML_ATTRIBUTE = /(?:^|\s)([a-z-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;
const MARKDOWN_LINK_TARGET = /(\]\(\s*<?)([^)\s>]+)/g;
/** A link reference definition, "[label]: target", not a footnote. */
const REFERENCE_DEFINITION =
  /^([ \t]*\[(?!\^)[^\]\n]+\]:[ \t]*<?)([^\s>]+)(?=>?(?:[ \t]+(?:"[^"\n]*"|'[^'\n]*'|\([^)\n]*\)))?[ \t]*\r?$)/gm;
const HTML_URL_ATTRIBUTE = /(\s(?:src|href)\s*=\s*)(["'])(.*?)\2/gi;
const YOUTUBE_HOST = /(^|\.)(youtube(-nocookie)?\.com|youtu\.be)$/i;

function iframeAttributes(attributes: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const match of attributes.matchAll(HTML_ATTRIBUTE)) {
    result[match[1].toLowerCase()] = match[2] ?? match[3] ?? "";
  }
  return result;
}

function nameFromUrl(src: string, base: string): string {
  let url: URL;
  try {
    url = new URL(src, base);
  } catch {
    return "";
  }
  if (YOUTUBE_HOST.test(url.hostname)) return "YouTube video";
  const lastSegment =
    url.pathname
      .split("/")
      .filter(Boolean)
      .pop()
      ?.replace(/\.html?$/i, "") ?? "";
  return oneLine(lastSegment.replace(/[-_]/g, " "));
}

/** "[Interactive: title](src)", naming it from its URL when it has no title. */
export function describeIframe(
  attributes: string,
  base: string = `${SITE_URL}/`,
): string {
  const { src = "", title = "" } = iframeAttributes(attributes);
  const target = src.trim();
  const name = (
    oneLine(title) ||
    nameFromUrl(target, base) ||
    "see the original article"
  ).replace(/[\\[\]]/g, "\\$&");
  return target
    ? `[Interactive: ${name}](${absoluteUrl(target, base)})`
    : `[Interactive: ${name}]`;
}

/** Apply `transform` to text outside inline code spans. */
function outsideInlineCode(
  text: string,
  transform: (text: string) => string,
): string {
  let result = "";
  let last = 0;
  for (const match of text.matchAll(INLINE_CODE)) {
    result += transform(text.slice(last, match.index)) + match[0];
    last = match.index + match[0].length;
  }
  return result + transform(text.slice(last));
}

/** Changes to the text outside fenced code blocks. */
function transformProse(text: string, base: string): string {
  return outsideInlineCode(text, (prose) =>
    prose
      .replace(HTML_COMMENT, "")
      .replace(SCRIPT_OR_STYLE, "")
      .replace(CLOSED_IFRAME, (_, attributes: string) =>
        describeIframe(attributes, base),
      )
      .replace(BARE_IFRAME, (_, attributes: string) =>
        describeIframe(attributes.replace(/\/\s*$/, ""), base),
      )
      .replace(
        MARKDOWN_LINK_TARGET,
        (_, prefix: string, target: string) =>
          prefix + absoluteUrl(target, base),
      )
      .replace(
        REFERENCE_DEFINITION,
        (_, prefix: string, target: string) =>
          prefix + absoluteUrl(target, base),
      )
      .replace(
        HTML_URL_ATTRIBUTE,
        (_, prefix: string, quote: string, target: string) =>
          prefix + quote + absoluteUrl(target, base) + quote,
      ),
  );
}

/**
 * The fenced code blocks in `markdown`, in order. A backtick line whose info
 * string holds a backtick is not a fence (CommonMark reads it as inline
 * code), so the search resumes on the next line.
 */
export function codeFences(markdown: string): RegExpExecArray[] {
  const pattern = new RegExp(CODE_FENCE.source, "gm");
  const fences: RegExpExecArray[] = [];
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(markdown)) !== null) {
    const [fence, , char, info] = match;
    if (char === "`" && info.includes("`")) {
      pattern.lastIndex = match.index + fence.indexOf("\n") + 1;
      continue;
    }
    fences.push(match);
  }
  return fences;
}

/**
 * Turn article markdown into the text the llms files carry. Plotly fences
 * become one-line summaries, other fences stay as written, and links resolve
 * against `base`, the article's own URL.
 */
export function transformArticleMarkdown(
  markdown: string,
  base: string = `${SITE_URL}/`,
): string {
  let result = "";
  let last = 0;
  for (const match of codeFences(markdown)) {
    const [fence, , , info, body] = match;
    // The page picks the language from the info string's first word.
    const language = info.trim().split(/\s+/)[0];
    result += transformProse(markdown.slice(last, match.index), base);
    result += language === "plotly" ? summarizePlotlyJson(body.trim()) : fence;
    last = match.index + fence.length;
  }
  return result + transformProse(markdown.slice(last), base);
}

/* ------------------------------------------------------------------ */
/*  Notebooks                                                          */
/* ------------------------------------------------------------------ */

function joinSource(source: unknown): string {
  if (typeof source === "string") return source;
  if (Array.isArray(source)) return source.join("");
  return "";
}

/**
 * A text/plain output. Like the page, read its first element as JSON; when
 * that fails, keep the whole output as a code block, where the page shows it
 * as a JSON array.
 */
function plainTextOutput(data: unknown): string | null {
  const text = Array.isArray(data) ? String(data[0] ?? "") : joinSource(data);
  let value: unknown;
  try {
    value = parseJSONSafe(text);
  } catch {
    const whole = joinSource(data).trim();
    return whole ? "```\n" + whole + "\n```" : null;
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
  if (data["text/plain"]) return plainTextOutput(data["text/plain"]);
  return null;
}

/**
 * Markdown cells and code-cell outputs, in order. Raw cells are left out; the
 * page shows them only as a JSON dump.
 */
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
export function articleToLlmsMarkdown(
  filename: string,
  raw: string,
  base: string = `${SITE_URL}/`,
): string {
  const markdown = filename.endsWith(".ipynb")
    ? notebookToMarkdown(JSON.parse(raw) as Notebook)
    : raw;
  return transformArticleMarkdown(markdown, base).trim();
}

/* ------------------------------------------------------------------ */
/*  Files                                                              */
/* ------------------------------------------------------------------ */

/** Newest first; the sort is stable, so posts with equal dates keep order. */
function newestFirst<T extends { date: string }>(posts: readonly T[]): T[] {
  return [...posts].sort(compareNewestFirst);
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
    `Tags: ${post.tags.map(singleLine).join(", ")}`,
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
      articleToLlmsMarkdown(
        post.filename,
        source.loadArticle(post.filename),
        postUrl(post),
      ),
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

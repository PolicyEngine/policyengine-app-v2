import { getPostsSorted } from "@/data/posts/postTransformers";
import { getArticleContent } from "@/lib/articles";
import { extractMarkdownFromNotebook } from "@/lib/notebookUtils";
import type { ResearchSearchIndexEntry } from "@/lib/researchSearch";
import type { Notebook } from "@/types/blog";

const FENCED_CODE_BLOCK = /```[\s\S]*?```/g;
const HTML_CONTENT_BLOCK = /<(iframe|script|style)\b[\s\S]*?<\/\1>/gi;
const MARKDOWN_IMAGE = /!\[([^\]]*)\]\([^)]*\)/g;
const MARKDOWN_LINK = /\[([^\]]+)\]\([^)]*\)/g;
const HTML_TAG = /<[^>]+>/g;
const HEADING_OR_LIST_PREFIX = /^\s*(?:#{1,6}|[-+*]|\d+\.)\s+/gm;
const FOOTNOTE_MARKER = /\[\^\d+\](?::)?/g;
const MARKDOWN_DECORATION = /[*_~`>|]/g;

function markdownToSearchText(markdown: string): string {
  return markdown
    .replace(FENCED_CODE_BLOCK, " ")
    .replace(HTML_CONTENT_BLOCK, " ")
    .replace(MARKDOWN_IMAGE, "$1")
    .replace(MARKDOWN_LINK, "$1")
    .replace(HTML_TAG, " ")
    .replace(HEADING_OR_LIST_PREFIX, "")
    .replace(FOOTNOTE_MARKER, " ")
    .replace(MARKDOWN_DECORATION, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getSearchableArticleText(
  filename: string,
  rawContent: string,
): string {
  if (filename.endsWith(".ipynb")) {
    const notebook = JSON.parse(rawContent) as Notebook;
    return markdownToSearchText(extractMarkdownFromNotebook(notebook));
  }

  return markdownToSearchText(rawContent);
}

export function buildResearchSearchIndex(): ResearchSearchIndexEntry[] {
  return getPostsSorted().map((post) => ({
    slug: post.slug,
    content: getSearchableArticleText(
      post.filename,
      getArticleContent(post.filename),
    ),
  }));
}

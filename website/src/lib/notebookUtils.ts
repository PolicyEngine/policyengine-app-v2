/**
 * Notebook utilities for processing Jupyter notebook files in blog articles.
 * Handles parsing, markdown extraction, and unicode decoding.
 */

import type { Notebook } from "@/types/blog";

/**
 * Extract markdown content from notebook cells for TOC and reading time.
 */
export function extractMarkdownFromNotebook(notebook: Notebook): string {
  return notebook.cells
    .filter((cell) => cell.cell_type === "markdown")
    .map((cell) => cell.source.join(""))
    .join("\n");
}

/**
 * Decode unicode escape sequences (e.g., \u00a3 → £).
 * Used for currency symbols in Plotly chart data.
 */
export function decode(str: string): string {
  return str.replaceAll("\\u00a3", "£");
}

/**
 * Recursively decode unicode escape sequences in objects, arrays, and strings.
 */
export function recursivelyDecode<T>(obj: T): T {
  if (typeof obj === "string") {
    return decode(obj) as T;
  }
  if (Array.isArray(obj)) {
    return obj.map(recursivelyDecode) as T;
  }
  if (!obj) {
    return obj;
  }
  if (typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj as object).map(([key, value]) => [
        key,
        recursivelyDecode(value),
      ]),
    ) as T;
  }
  return obj;
}

/**
 * Safely parse JSON with unicode decoding.
 */
export function parseJSONSafe(str: string): unknown {
  const cleaned = str.replaceAll("'", "");
  return recursivelyDecode(JSON.parse(cleaned));
}

/**
 * Check if a filename is a Jupyter notebook.
 */
export function isNotebookFile(filename: string): boolean {
  return filename.endsWith(".ipynb");
}

const FOOTNOTE_DEFINITION_REGEX =
  /^\[\^(\d+)\]:\s*([\s\S]+?)(?=\n\[\^|\n\n|$)/gm;

/**
 * Extract footnote definitions from markdown content.
 * Returns footnote numbers as keys and definitions as values.
 */
export function extractFootnoteDefinitions(
  markdown: string,
): Record<string, string> {
  const footnotes: Record<string, string> = {};
  const matches = markdown.matchAll(FOOTNOTE_DEFINITION_REGEX);

  for (const match of matches) {
    footnotes[match[1]] = match[2].trim();
  }

  return footnotes;
}

/**
 * Extract all footnote definitions from a notebook's markdown cells.
 */
export function extractNotebookFootnotes(
  notebook: Notebook,
): Record<string, string> {
  const allFootnotes: Record<string, string> = {};

  for (const cell of notebook.cells) {
    if (cell.cell_type === "markdown") {
      const cellMarkdown = cell.source.join("");
      Object.assign(allFootnotes, extractFootnoteDefinitions(cellMarkdown));
    }
  }

  return allFootnotes;
}

/**
 * Check if markdown contains footnote references (e.g., [^1]).
 * Excludes footnote definitions (which start lines with [^n]:).
 */
export function hasFootnoteReferences(markdown: string): boolean {
  return /\[\^\d+\](?!:)/m.test(markdown);
}

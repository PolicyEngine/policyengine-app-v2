/**
 * Notebook Utilities
 *
 * Utility functions for processing Jupyter notebook files in blog articles.
 * Handles parsing, markdown extraction, and data decoding for notebook content.
 */

import type { Notebook } from '@/types/blog';

/**
 * Extract markdown content from notebook cells for TOC and reading time
 */
export function extractMarkdownFromNotebook(notebook: Notebook): string {
  return notebook.cells
    .filter((cell) => cell.cell_type === 'markdown')
    .map((cell) => cell.source.join(''))
    .join('\n');
}

/**
 * Decode unicode escape sequences in strings (e.g., \u00a3 → £)
 * Used for handling currency symbols in Plotly chart data
 */
export function decode(str: string): string {
  return str.replaceAll('\\u00a3', '£');
}

/**
 * Recursively decode unicode escape sequences in objects, arrays, and strings
 */
export function recursivelyDecode<T>(obj: T): T {
  if (typeof obj === 'string') {
    return decode(obj) as T;
  }
  if (Array.isArray(obj)) {
    return obj.map(recursivelyDecode) as T;
  }
  if (!obj) {
    return obj;
  }
  if (typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj as object).map(([key, value]) => [key, recursivelyDecode(value)])
    ) as T;
  }
  return obj;
}

/**
 * Safely parse JSON with unicode decoding
 * Removes single quotes and applies recursive decoding
 */
export function parseJSONSafe(str: string): unknown {
  const cleaned = str.replaceAll("'", '');
  return recursivelyDecode(JSON.parse(cleaned));
}

/**
 * Check if a filename is a Jupyter notebook
 */
export function isNotebookFile(filename: string): boolean {
  return filename.endsWith('.ipynb');
}

/**
 * Regex to match footnote definitions like [^1]: Some text
 * Matches multi-line footnotes (definition continues until next footnote or blank line)
 */
const FOOTNOTE_DEFINITION_REGEX = /^\[\^(\d+)\]:\s*(.+?)(?=\n\[\^|\n\n|$)/gms;

/**
 * Extract footnote definitions from markdown content
 * Returns an object with footnote numbers as keys and definitions as values
 */
export function extractFootnoteDefinitions(markdown: string): Record<string, string> {
  const footnotes: Record<string, string> = {};
  const matches = markdown.matchAll(FOOTNOTE_DEFINITION_REGEX);

  for (const match of matches) {
    const footnoteNum = match[1];
    const footnoteText = match[2].trim();
    footnotes[footnoteNum] = footnoteText;
  }

  return footnotes;
}

/**
 * Extract all footnote definitions from a notebook
 */
export function extractNotebookFootnotes(notebook: Notebook): Record<string, string> {
  const allFootnotes: Record<string, string> = {};

  for (const cell of notebook.cells) {
    if (cell.cell_type === 'markdown') {
      const cellMarkdown = cell.source.join('');
      const cellFootnotes = extractFootnoteDefinitions(cellMarkdown);
      Object.assign(allFootnotes, cellFootnotes);
    }
  }

  return allFootnotes;
}

/**
 * Check if markdown contains footnote references (e.g., [^1])
 * Matches [^n] that are NOT at the start of a line (definitions start at line beginning)
 */
export function hasFootnoteReferences(markdown: string): boolean {
  // Match [^n] where n is a number, but not followed by : (which would be a definition)
  return /\[\^\d+\](?!:)/m.test(markdown);
}

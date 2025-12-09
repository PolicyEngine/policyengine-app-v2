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
  } else if (Array.isArray(obj)) {
    return obj.map(recursivelyDecode) as T;
  } else if (!obj) {
    return obj;
  } else if (typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj as object).map(([key, value]) => [key, recursivelyDecode(value)])
    ) as T;
  } else {
    return obj;
  }
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

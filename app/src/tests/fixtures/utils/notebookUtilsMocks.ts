/**
 * Test fixtures for notebookUtils tests
 */

import type { Notebook } from '@/types/blog';

/**
 * Sample notebook with mixed cell types for testing markdown extraction
 */
export const MOCK_NOTEBOOK_WITH_MARKDOWN: Notebook = {
  cells: [
    { cell_type: 'markdown', source: ['# Title\n', 'Some text'] },
    { cell_type: 'code', source: ['print("hello")'] },
    { cell_type: 'markdown', source: ['## Section\n', 'More text'] },
  ],
};

/**
 * Notebook with only code cells (no markdown)
 */
export const MOCK_NOTEBOOK_CODE_ONLY: Notebook = {
  cells: [{ cell_type: 'code', source: ['print("hello")'] }],
};

/**
 * Notebook with footnotes spread across multiple cells
 */
export const MOCK_NOTEBOOK_WITH_FOOTNOTES: Notebook = {
  cells: [
    { cell_type: 'markdown', source: ['Text[^1]\n\n[^1]: First note.'] },
    { cell_type: 'code', source: ['# code'] },
    { cell_type: 'markdown', source: ['More[^2]\n\n[^2]: Second note.'] },
  ],
};

/**
 * Unicode test strings
 */
export const UNICODE_STRINGS = {
  POUND_SYMBOL: '\\u00a3',
  DECODED_POUND: '£',
  PRICE_WITH_UNICODE: 'Price: \\u00a3100',
  PRICE_DECODED: 'Price: £100',
  MULTIPLE_UNICODE: '\\u00a350 to \\u00a3100',
  MULTIPLE_DECODED: '£50 to £100',
} as const;

/**
 * Markdown content with footnotes for testing extraction
 */
export const MARKDOWN_WITH_FOOTNOTES = `Some text with a reference[^1].

[^1]: This is the first footnote.
[^2]: This is the second footnote.`;

/**
 * Expected footnote extraction results
 */
export const EXPECTED_FOOTNOTES = {
  '1': 'This is the first footnote.',
  '2': 'This is the second footnote.',
} as const;

/**
 * Markdown with footnote containing a link
 */
export const MARKDOWN_FOOTNOTE_WITH_LINK = `[^1]: See [this source](https://example.com) for more info.`;

/**
 * Test filenames for notebook detection
 */
export const TEST_FILENAMES = {
  NOTEBOOK: 'article.ipynb',
  NOTEBOOK_WITH_PATH: 'path/to/notebook.ipynb',
  MARKDOWN: 'article.md',
  TEXT: 'article.txt',
  BACKUP: 'article.ipynb.bak',
} as const;

/**
 * JSON strings for parseJSONSafe tests
 */
export const JSON_TEST_STRINGS = {
  WITH_UNICODE: '{"price": "\\u00a3100"}',
  WITH_SINGLE_QUOTES: '{"name": "Test\'s Value"}',
} as const;

/**
 * Markdown strings for footnote reference detection
 */
export const FOOTNOTE_REFERENCE_STRINGS = {
  WITH_REFERENCE: 'Some text[^1] here.',
  MULTIPLE_REFERENCES: 'Multiple[^1] refs[^2].',
  DEFINITION_ONLY: '[^1]: This is a definition',
  NO_FOOTNOTES: 'Plain text without footnotes.',
  BOTH_REF_AND_DEF: `Some text[^1] here.

[^1]: The definition.`,
} as const;

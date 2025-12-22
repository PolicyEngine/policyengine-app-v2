import { describe, expect, test } from 'vitest';
import {
  EXPECTED_FOOTNOTES,
  FOOTNOTE_REFERENCE_STRINGS,
  JSON_TEST_STRINGS,
  MARKDOWN_FOOTNOTE_WITH_LINK,
  MARKDOWN_WITH_FOOTNOTES,
  MOCK_NOTEBOOK_CODE_ONLY,
  MOCK_NOTEBOOK_WITH_FOOTNOTES,
  MOCK_NOTEBOOK_WITH_MARKDOWN,
  TEST_FILENAMES,
  UNICODE_STRINGS,
} from '@/tests/fixtures/utils/notebookUtilsMocks';
import {
  decode,
  extractFootnoteDefinitions,
  extractMarkdownFromNotebook,
  extractNotebookFootnotes,
  hasFootnoteReferences,
  isNotebookFile,
  parseJSONSafe,
  recursivelyDecode,
} from '@/utils/notebookUtils';

describe('notebookUtils', () => {
  describe('isNotebookFile', () => {
    test('given .ipynb extension then returns true', () => {
      expect(isNotebookFile(TEST_FILENAMES.NOTEBOOK)).toBe(true);
      expect(isNotebookFile(TEST_FILENAMES.NOTEBOOK_WITH_PATH)).toBe(true);
    });

    test('given non-ipynb extension then returns false', () => {
      expect(isNotebookFile(TEST_FILENAMES.MARKDOWN)).toBe(false);
      expect(isNotebookFile(TEST_FILENAMES.TEXT)).toBe(false);
      expect(isNotebookFile(TEST_FILENAMES.BACKUP)).toBe(false);
    });
  });

  describe('decode', () => {
    test('given unicode pound symbol then decodes correctly', () => {
      expect(decode(UNICODE_STRINGS.PRICE_WITH_UNICODE)).toBe(UNICODE_STRINGS.PRICE_DECODED);
    });

    test('given multiple unicode sequences then decodes all', () => {
      expect(decode(UNICODE_STRINGS.MULTIPLE_UNICODE)).toBe(UNICODE_STRINGS.MULTIPLE_DECODED);
    });

    test('given no unicode sequences then returns unchanged', () => {
      const plainText = 'Plain text';
      expect(decode(plainText)).toBe(plainText);
    });
  });

  describe('recursivelyDecode', () => {
    test('given string with unicode then decodes', () => {
      expect(recursivelyDecode(`${UNICODE_STRINGS.POUND_SYMBOL}100`)).toBe(
        `${UNICODE_STRINGS.DECODED_POUND}100`
      );
    });

    test('given array with unicode strings then decodes all', () => {
      const input = [`${UNICODE_STRINGS.POUND_SYMBOL}50`, `${UNICODE_STRINGS.POUND_SYMBOL}100`];
      expect(recursivelyDecode(input)).toEqual([
        `${UNICODE_STRINGS.DECODED_POUND}50`,
        `${UNICODE_STRINGS.DECODED_POUND}100`,
      ]);
    });

    test('given nested object then decodes recursively', () => {
      const input = {
        price: `${UNICODE_STRINGS.POUND_SYMBOL}100`,
        nested: {
          amount: `${UNICODE_STRINGS.POUND_SYMBOL}50`,
        },
      };
      expect(recursivelyDecode(input)).toEqual({
        price: `${UNICODE_STRINGS.DECODED_POUND}100`,
        nested: {
          amount: `${UNICODE_STRINGS.DECODED_POUND}50`,
        },
      });
    });

    test('given null or undefined then returns unchanged', () => {
      expect(recursivelyDecode(null)).toBe(null);
      expect(recursivelyDecode(undefined)).toBe(undefined);
    });

    test('given number then returns unchanged', () => {
      expect(recursivelyDecode(42)).toBe(42);
    });
  });

  describe('parseJSONSafe', () => {
    test('given valid JSON then parses and decodes', () => {
      expect(parseJSONSafe(JSON_TEST_STRINGS.WITH_UNICODE)).toEqual({
        price: `${UNICODE_STRINGS.DECODED_POUND}100`,
      });
    });

    test('given JSON with single quotes then removes them', () => {
      expect(parseJSONSafe(JSON_TEST_STRINGS.WITH_SINGLE_QUOTES)).toEqual({
        name: 'Tests Value',
      });
    });
  });

  describe('extractMarkdownFromNotebook', () => {
    test('given notebook with markdown cells then extracts content', () => {
      // When
      const result = extractMarkdownFromNotebook(MOCK_NOTEBOOK_WITH_MARKDOWN);

      // Then
      expect(result).toBe('# Title\nSome text\n## Section\nMore text');
    });

    test('given notebook with no markdown cells then returns empty string', () => {
      // When
      const result = extractMarkdownFromNotebook(MOCK_NOTEBOOK_CODE_ONLY);

      // Then
      expect(result).toBe('');
    });
  });

  describe('extractFootnoteDefinitions', () => {
    test('given markdown with footnotes then extracts definitions', () => {
      // When
      const result = extractFootnoteDefinitions(MARKDOWN_WITH_FOOTNOTES);

      // Then
      expect(result).toEqual(EXPECTED_FOOTNOTES);
    });

    test('given markdown with no footnotes then returns empty object', () => {
      // Given
      const markdown = 'Just regular text without footnotes.';

      // When
      const result = extractFootnoteDefinitions(markdown);

      // Then
      expect(result).toEqual({});
    });

    test('given footnote with link then extracts full definition', () => {
      // When
      const result = extractFootnoteDefinitions(MARKDOWN_FOOTNOTE_WITH_LINK);

      // Then
      expect(result['1']).toBe('See [this source](https://example.com) for more info.');
    });
  });

  describe('extractNotebookFootnotes', () => {
    test('given notebook with footnotes in multiple cells then extracts all', () => {
      // When
      const result = extractNotebookFootnotes(MOCK_NOTEBOOK_WITH_FOOTNOTES);

      // Then
      expect(result).toEqual({
        '1': 'First note.',
        '2': 'Second note.',
      });
    });
  });

  describe('hasFootnoteReferences', () => {
    test('given markdown with footnote reference then returns true', () => {
      expect(hasFootnoteReferences(FOOTNOTE_REFERENCE_STRINGS.WITH_REFERENCE)).toBe(true);
      expect(hasFootnoteReferences(FOOTNOTE_REFERENCE_STRINGS.MULTIPLE_REFERENCES)).toBe(true);
    });

    test('given markdown with only footnote definition then returns false', () => {
      expect(hasFootnoteReferences(FOOTNOTE_REFERENCE_STRINGS.DEFINITION_ONLY)).toBe(false);
    });

    test('given markdown with no footnotes then returns false', () => {
      expect(hasFootnoteReferences(FOOTNOTE_REFERENCE_STRINGS.NO_FOOTNOTES)).toBe(false);
    });

    test('given markdown with both reference and definition then returns true', () => {
      expect(hasFootnoteReferences(FOOTNOTE_REFERENCE_STRINGS.BOTH_REF_AND_DEF)).toBe(true);
    });
  });
});

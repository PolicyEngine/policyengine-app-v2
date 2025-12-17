import { render, screen } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import { FootnotesSection, MarkdownFormatter } from '@/components/blog/MarkdownFormatter';
import {
  EXPECTED_LINK_ATTRS,
  FOOTNOTE_HREFS,
  FOOTNOTE_IDS,
  FOOTNOTE_SAMPLES,
  MARKDOWN_SAMPLES,
} from '@/tests/fixtures/components/blog/MarkdownFormatterMocks';

// Mock Plotly to avoid rendering issues in tests
// Note: vi.mock is hoisted, so the mock must be defined inline (not imported)
vi.mock('react-plotly.js', () => ({ default: vi.fn(() => null) }));

describe('MarkdownFormatter', () => {
  describe('MarkdownFormatter component', () => {
    test('given markdown with paragraph then renders text', () => {
      // Given/When
      render(<MarkdownFormatter markdown={MARKDOWN_SAMPLES.PARAGRAPH} />);

      // Then
      expect(screen.getByText(MARKDOWN_SAMPLES.PARAGRAPH)).toBeInTheDocument();
    });

    test('given markdown with link then renders clickable link', () => {
      // Given/When
      render(<MarkdownFormatter markdown={MARKDOWN_SAMPLES.WITH_LINK} />);

      // Then
      const link = screen.getByRole('link', { name: 'Example' });
      expect(link).toHaveAttribute('href', 'https://example.com');
    });

    test('given markdown with heading then renders with correct level', () => {
      // Given/When
      render(<MarkdownFormatter markdown={MARKDOWN_SAMPLES.WITH_HEADING} />);

      // Then
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Section Title');
    });

    test('given empty markdown then renders no content', () => {
      // Given/When
      render(<MarkdownFormatter markdown={MARKDOWN_SAMPLES.EMPTY} />);

      // Then - No paragraph or heading content should be rendered
      expect(screen.queryByRole('paragraph')).toBeNull();
      expect(screen.queryByRole('heading')).toBeNull();
    });

    test('given markdown with bold text then renders strong element', () => {
      // Given/When
      render(<MarkdownFormatter markdown={MARKDOWN_SAMPLES.WITH_BOLD} />);

      // Then
      expect(screen.getByText('bold')).toBeInTheDocument();
    });

    test('given markdown with list then renders list', () => {
      // Given/When
      render(<MarkdownFormatter markdown={MARKDOWN_SAMPLES.WITH_LIST} />);

      // Then
      expect(screen.getByRole('list')).toBeInTheDocument();
    });
  });

  describe('FootnotesSection component', () => {
    test('given footnotes object then renders numbered list', () => {
      // Given/When
      render(<FootnotesSection footnotes={FOOTNOTE_SAMPLES.BASIC} />);

      // Then
      expect(screen.getByText('First footnote text.')).toBeInTheDocument();
      expect(screen.getByText('Second footnote text.')).toBeInTheDocument();
    });

    test('given empty footnotes then renders no list', () => {
      // Given/When
      render(<FootnotesSection footnotes={FOOTNOTE_SAMPLES.EMPTY} />);

      // Then - No list should be rendered
      expect(screen.queryByRole('list')).toBeNull();
    });

    test('given footnotes with links then renders clickable links', () => {
      // Given/When
      render(<FootnotesSection footnotes={FOOTNOTE_SAMPLES.WITH_LINK} />);

      // Then
      const link = screen.getByRole('link', { name: 'source' });
      expect(link).toHaveAttribute('href', 'https://example.com');
      expect(link).toHaveAttribute('target', EXPECTED_LINK_ATTRS.EXTERNAL_TARGET);
    });

    test('given footnotes then renders back-reference links', () => {
      // Given/When
      render(<FootnotesSection footnotes={FOOTNOTE_SAMPLES.BASIC} />);

      // Then
      const backLink = screen.getAllByRole('link', { name: 'Back to reference' })[0];
      expect(backLink).toHaveAttribute('href', FOOTNOTE_HREFS.BACK_REF_1);
    });

    test('given footnotes then assigns correct IDs for linking', () => {
      // Given/When
      render(<FootnotesSection footnotes={FOOTNOTE_SAMPLES.BASIC} />);

      // Then
      expect(document.getElementById(FOOTNOTE_IDS.FN_1)).toBeInTheDocument();
      expect(document.getElementById(FOOTNOTE_IDS.FN_2)).toBeInTheDocument();
    });

    test('given unordered footnote keys then renders in numeric order', () => {
      // Given/When
      render(<FootnotesSection footnotes={FOOTNOTE_SAMPLES.UNORDERED} />);

      // Then - Should be ordered 1, 2, 3
      const listItems = screen.getAllByRole('listitem');
      expect(listItems[0]).toHaveTextContent('First.');
      expect(listItems[1]).toHaveTextContent('Second.');
      expect(listItems[2]).toHaveTextContent('Third.');
    });

    test('given footnote with multiple links then renders all links', () => {
      // Given/When
      render(<FootnotesSection footnotes={FOOTNOTE_SAMPLES.WITH_MULTIPLE_LINKS} />);

      // Then
      expect(screen.getByRole('link', { name: 'link1' })).toHaveAttribute(
        'href',
        'https://one.com'
      );
      expect(screen.getByRole('link', { name: 'link2' })).toHaveAttribute(
        'href',
        'https://two.com'
      );
    });
  });
});

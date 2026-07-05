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

// Mock LazyPlot (lazy-loaded Plotly wrapper) to avoid rendering issues in tests
vi.mock('@/components/blog/LazyPlot', () => ({
  LazyPlot: vi.fn(() => null),
}));

vi.mock('../../../../components/blog/blogStyles', () => ({
  blogColors: {
    primary: '#2c7a7b',
    primaryHover: '#285e61',
    backgroundPrimary: '#ffffff',
    backgroundSecondary: '#f9fafb',
    backgroundCode: '#f5f5f5',
    backgroundCodeLabel: '#f0f0f0',
    backgroundTable: '#f2f2f2',
    textPrimary: '#333333',
    textSecondary: '#555555',
    textTertiary: '#666666',
    textHeading: '#222222',
    borderLight: '#f0f0f0',
    borderMedium: '#eeeeee',
    borderDark: '#dddddd',
    link: '#2c7a7b',
    anchorLink: '#9ca3af',
  },
  blogFontWeights: {
    regular: 400,
    medium: 500,
    semiBold: 600,
    bold: 700,
  },
  blogRadius: {
    none: 0,
    sm: 2,
    md: 8,
    blockquote: '0 4px 4px 0',
  },
  blogShadows: {
    image: '0 4px 12px rgba(0,0,0,0.08)',
    table: '0 4px 6px rgba(0,0,0,0.1)',
    tableCell: '0 1px 2px rgba(0,0,0,0.05)',
    codeBlock: '0 2px 8px rgba(0,0,0,0.05)',
    highlightedBlock: '0px 0px 10px 0px rgba(0,0,0,0.75)',
  },
  blogBreakpoints: {
    mobile: 768,
    tablet: 1024,
    desktop: 1280,
  },
  blogSpacing: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
    marginBottom: {
      paragraph: 8,
      list: 24,
      image: 25,
      table: 30,
      code: 24,
    },
    marginTop: {
      paragraph: 18,
      image: 25,
      heading1: 32,
      heading2: 28,
      heading3: 24,
      heading4: 20,
      list: 12,
      table: 30,
    },
    padding: {
      blockquote: 16,
      code: '2px 6px',
      codeBlock: 16,
      table: { cell: 8, header: 10 },
    },
  },
  blogTypography: {
    headingFont: 'system-ui',
    bodyFont: 'system-ui',
    monoFont: 'monospace',
    h1Desktop: '2.5rem',
    h1Mobile: '2rem',
    h2Desktop: '2rem',
    h2Mobile: '1.75rem',
    h3Desktop: '1.5rem',
    h3Mobile: '1.25rem',
    h4Desktop: '1.25rem',
    h4Mobile: '1.125rem',
    h5Desktop: '1.125rem',
    h5Mobile: '1rem',
    h6Desktop: '1rem',
    h6Mobile: '0.875rem',
    bodyDesktop: '18px',
    bodyMobile: '18px',
    smallDesktop: '0.875rem',
    smallMobile: '0.75rem',
    headingLineHeight: '1.3',
    bodyLineHeight: '1.6',
    bold: 700,
    semiBold: 600,
    medium: 500,
    regular: 400,
  },
}));

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

    test('given raw HTML markdown then does not render raw elements', () => {
      // Given
      const markdown = 'Paragraph before HTML.\n\n<img src="x" alt="malicious" onerror="alert(1)" />';

      // When
      render(<MarkdownFormatter markdown={markdown} />);

      // Then
      expect(screen.getByText('Paragraph before HTML.')).toBeInTheDocument();
      expect(screen.queryByRole('img', { name: 'malicious' })).toBeNull();
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

    test('given footnote with javascript href then keeps text but not a link', () => {
      // Given
      const footnotes = {
        1: 'Read the [source](javascript:alert) before trusting it.',
      };

      // When
      render(<FootnotesSection footnotes={footnotes} />);

      // Then
      expect(
        screen.getByText(
          (_, element) =>
            element?.tagName.toLowerCase() === 'li' &&
            element.textContent?.includes('Read the source before trusting it.') === true
        )
      ).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'source' })).toBeNull();
    });
  });
});

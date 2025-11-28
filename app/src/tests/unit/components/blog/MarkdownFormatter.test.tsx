/**
 * Tests for MarkdownFormatter component
 * Verifies markdown rendering including LaTeX math support
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MarkdownFormatter } from '@/components/blog/MarkdownFormatter';

// Mock useDisplayCategory hook
vi.mock('@/components/blog/useDisplayCategory', () => ({
  useDisplayCategory: () => 'desktop',
}));

// Mock react-plotly.js to avoid canvas issues in tests
vi.mock('react-plotly.js', () => ({
  default: () => <div data-testid="plotly-chart">Plotly Chart</div>,
}));

// Mock KaTeX CSS import (not available in jsdom)
vi.mock('katex/dist/katex.min.css', () => ({}));

describe('MarkdownFormatter', () => {
  describe('basic markdown rendering', () => {
    it('renders paragraph text', () => {
      render(<MarkdownFormatter markdown="Hello world" />);
      expect(screen.getByText('Hello world')).toBeInTheDocument();
    });

    it('renders headings', () => {
      render(<MarkdownFormatter markdown="## Test Heading" />);
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Test Heading');
    });

    it('renders links', () => {
      render(<MarkdownFormatter markdown="[Link text](https://example.com)" />);
      const link = screen.getByRole('link', { name: 'Link text' });
      expect(link).toHaveAttribute('href', 'https://example.com');
    });

    it('renders bold text', () => {
      render(<MarkdownFormatter markdown="**bold text**" />);
      expect(screen.getByText('bold text')).toBeInTheDocument();
    });

    it('renders unordered lists', () => {
      render(<MarkdownFormatter markdown={`- Item 1
- Item 2`} />);
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
    });

    it('renders ordered lists', () => {
      render(<MarkdownFormatter markdown={`1. First
2. Second`} />);
      expect(screen.getByText('First')).toBeInTheDocument();
      expect(screen.getByText('Second')).toBeInTheDocument();
    });
  });

  describe('table rendering', () => {
    it('renders markdown tables', () => {
      const tableMarkdown = `
| Header 1 | Header 2 |
| -------- | -------- |
| Cell 1   | Cell 2   |
`;
      render(<MarkdownFormatter markdown={tableMarkdown} />);
      expect(screen.getByText('Header 1')).toBeInTheDocument();
      expect(screen.getByText('Cell 1')).toBeInTheDocument();
    });
  });

  describe('LaTeX math rendering', () => {
    // Helper to check for KaTeX rendered content
    const hasKatexContent = () => {
      // KaTeX renders to elements with class 'katex' or MathML elements
      return (
        document.querySelector('.katex') !== null ||
        document.querySelector('math') !== null ||
        document.querySelector('[class*="katex"]') !== null
      );
    };

    const hasDisplayMath = () => {
      return (
        document.querySelector('.katex-display') !== null ||
        document.querySelector('[class*="katex-display"]') !== null ||
        document.querySelector('math[display="block"]') !== null
      );
    };

    it('renders inline math with single dollar signs', () => {
      const { container } = render(<MarkdownFormatter markdown="The formula is $x^2$" />);
      // KaTeX wraps math in a span with class 'katex'
      expect(hasKatexContent()).toBe(true);
    });

    it('renders display math with double dollar signs', () => {
      // Display math needs to be on its own line(s) for remark-math
      render(<MarkdownFormatter markdown={`
$$E = mc^2$$
`} />);
      // Display math should have katex-display class
      expect(hasDisplayMath()).toBe(true);
    });

    it('renders complex equations', () => {
      const complexMath = `
$$\\text{Household benefit}_i = \\text{Total cost} \\times \\frac{\\text{Rail spending}_i \\times \\text{Weight}_i}{\\sum_j \\text{Rail spending}_j \\times \\text{Weight}_j}$$
`;
      render(<MarkdownFormatter markdown={complexMath} />);
      expect(hasDisplayMath()).toBe(true);
    });

    it('renders inline math within paragraphs', () => {
      render(
        <MarkdownFormatter markdown="The value of $\pi$ is approximately 3.14159" />
      );
      expect(hasKatexContent()).toBe(true);
      expect(screen.getByText(/approximately 3.14159/)).toBeInTheDocument();
    });

    it('renders multiple math expressions in same paragraph', () => {
      render(
        <MarkdownFormatter markdown="Given $a = 1$ and $b = 2$, we find $a + b = 3$" />
      );
      const katexElements = document.querySelectorAll('.katex');
      expect(katexElements.length).toBeGreaterThanOrEqual(3);
    });

    it('renders fractions', () => {
      render(<MarkdownFormatter markdown={`
$$\\frac{a}{b}$$
`} />);
      expect(hasDisplayMath()).toBe(true);
    });

    it('renders Greek letters', () => {
      render(<MarkdownFormatter markdown="$\\alpha, \\beta, \\gamma$" />);
      expect(hasKatexContent()).toBe(true);
    });

    it('renders subscripts and superscripts', () => {
      render(<MarkdownFormatter markdown="$x_i^2$ and $y_{max}$" />);
      expect(hasKatexContent()).toBe(true);
    });

    it('renders summation notation', () => {
      render(<MarkdownFormatter markdown={`
$$\\sum_{i=1}^{n} x_i$$
`} />);
      expect(hasDisplayMath()).toBe(true);
    });
  });

  describe('plotly chart rendering', () => {
    it('renders plotly code blocks as charts', () => {
      const plotlyMarkdown = '```plotly\n{"data": [], "layout": {}}\n```';
      render(<MarkdownFormatter markdown={plotlyMarkdown} />);
      expect(screen.getByTestId('plotly-chart')).toBeInTheDocument();
    });
  });

  describe('code blocks', () => {
    it('renders inline code', () => {
      render(<MarkdownFormatter markdown="Use `code` here" />);
      expect(screen.getByText('code')).toBeInTheDocument();
    });

    it('renders code blocks with language', () => {
      const codeBlock = '```python\nprint("hello")\n```';
      render(<MarkdownFormatter markdown={codeBlock} />);
      expect(screen.getByText('print("hello")')).toBeInTheDocument();
    });
  });

  describe('returns null for empty content', () => {
    it('returns null when markdown is empty', () => {
      const { container } = render(<MarkdownFormatter markdown="" />);
      expect(container.firstChild).toBeNull();
    });

    it('returns null when markdown is undefined', () => {
      const { container } = render(<MarkdownFormatter markdown={undefined as any} />);
      expect(container.firstChild).toBeNull();
    });
  });
});

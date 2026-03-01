import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Text } from '@/components/ui/Text';

describe('Text', () => {
  it('renders children', () => {
    render(<Text>Hello world</Text>);
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('renders as <p> by default', () => {
    render(<Text>paragraph</Text>);
    expect(screen.getByText('paragraph').tagName).toBe('P');
  });

  it('renders as <span> when span prop is true', () => {
    render(<Text span>inline</Text>);
    expect(screen.getByText('inline').tagName).toBe('SPAN');
  });

  it('renders with custom component', () => {
    render(<Text component="label">label text</Text>);
    expect(screen.getByText('label text').tagName).toBe('LABEL');
  });

  it('applies size variants', () => {
    const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
    const expected = ['tw:text-xs', 'tw:text-sm', 'tw:text-base', 'tw:text-lg', 'tw:text-xl'];

    sizes.forEach((size, i) => {
      const { unmount } = render(<Text size={size}>text</Text>);
      expect(screen.getByText('text').className).toContain(expected[i]);
      unmount();
    });
  });

  it('applies weight variants', () => {
    const weights = ['normal', 'medium', 'semibold', 'bold'] as const;
    const expected = ['tw:font-normal', 'tw:font-medium', 'tw:font-semibold', 'tw:font-bold'];

    weights.forEach((weight, i) => {
      const { unmount } = render(<Text weight={weight}>text</Text>);
      expect(screen.getByText('text').className).toContain(expected[i]);
      unmount();
    });
  });

  it('applies fw prop as inline style', () => {
    render(<Text fw={600}>weighted</Text>);
    expect(screen.getByText('weighted')).toHaveStyle({ fontWeight: 600 });
  });

  it('applies c prop as inline color style', () => {
    render(<Text c="red">colored</Text>);
    expect(screen.getByText('colored').style.color).toBe('red');
  });

  it('forwards ref', () => {
    const ref = createRef<HTMLElement>();
    render(<Text ref={ref}>ref test</Text>);
    expect(ref.current).toBeInstanceOf(HTMLElement);
    expect(ref.current?.textContent).toBe('ref test');
  });

  it('merges className', () => {
    render(<Text className="custom-class">merged</Text>);
    expect(screen.getByText('merged').className).toContain('custom-class');
  });

  it('passes through additional HTML attributes', () => {
    render(
      <Text data-testid="custom" aria-label="accessible">
        attrs
      </Text>
    );
    expect(screen.getByTestId('custom')).toBeInTheDocument();
    expect(screen.getByLabelText('accessible')).toBeInTheDocument();
  });

  it('merges style prop with fw and c', () => {
    render(
      <Text fw={700} c="blue" style={{ marginTop: '10px' }}>
        styled
      </Text>
    );
    const el = screen.getByText('styled');
    expect(el.style.fontWeight).toBe('700');
    expect(el.style.color).toBe('blue');
    expect(el.style.marginTop).toBe('10px');
  });
});

import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Title } from '@/components/ui/Title';

describe('Title', () => {
  it('renders children', () => {
    render(<Title>My title</Title>);
    expect(screen.getByText('My title')).toBeInTheDocument();
  });

  it('renders as h1 by default', () => {
    render(<Title>heading</Title>);
    expect(screen.getByText('heading').tagName).toBe('H1');
  });

  it('renders correct heading element for each order', () => {
    const orders = [1, 2, 3, 4, 5, 6] as const;

    orders.forEach((order) => {
      const { unmount } = render(<Title order={order}>heading {order}</Title>);
      expect(screen.getByText(`heading ${order}`).tagName).toBe(`H${order}`);
      unmount();
    });
  });

  it('applies correct styles for each order', () => {
    const orderClasses = {
      1: ['tw:text-4xl', 'tw:font-bold'],
      2: ['tw:text-3xl', 'tw:font-bold'],
      3: ['tw:text-2xl', 'tw:font-semibold'],
      4: ['tw:text-xl', 'tw:font-semibold'],
      5: ['tw:text-lg', 'tw:font-medium'],
      6: ['tw:text-base', 'tw:font-medium'],
    } as const;

    (Object.entries(orderClasses) as [string, readonly string[]][]).forEach(([order, classes]) => {
      const { unmount } = render(
        <Title order={Number(order) as 1 | 2 | 3 | 4 | 5 | 6}>heading</Title>
      );
      const el = screen.getByText('heading');
      classes.forEach((cls) => {
        expect(el.className).toContain(cls);
      });
      unmount();
    });
  });

  it('forwards ref', () => {
    const ref = createRef<HTMLHeadingElement>();
    render(<Title ref={ref}>ref test</Title>);
    expect(ref.current).toBeInstanceOf(HTMLHeadingElement);
  });

  it('merges className', () => {
    render(<Title className="custom-heading">styled</Title>);
    expect(screen.getByText('styled').className).toContain('custom-heading');
  });

  it('passes through additional HTML attributes', () => {
    render(
      <Title data-testid="title" aria-label="main title">
        attrs
      </Title>
    );
    expect(screen.getByTestId('title')).toBeInTheDocument();
    expect(screen.getByLabelText('main title')).toBeInTheDocument();
  });
});

import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Container } from '@/components/ui/Container';

describe('Container', () => {
  it('renders children', () => {
    render(<Container>content inside</Container>);
    expect(screen.getByText('content inside')).toBeInTheDocument();
  });

  it('applies default max-width when no size', () => {
    render(<Container data-testid="container">content</Container>);
    expect(screen.getByTestId('container').className).toContain('tw:max-w-[976px]');
  });

  it('applies mx-auto and w-full', () => {
    render(<Container data-testid="container">content</Container>);
    const el = screen.getByTestId('container');
    expect(el.className).toContain('tw:mx-auto');
    expect(el.className).toContain('tw:w-full');
  });

  it('applies padding', () => {
    render(<Container data-testid="container">content</Container>);
    expect(screen.getByTestId('container').className).toContain('tw:px-lg');
  });

  it('applies size variants', () => {
    const sizes = {
      xs: 'tw:max-w-screen-xs',
      sm: 'tw:max-w-screen-sm',
      md: 'tw:max-w-screen-md',
      lg: 'tw:max-w-screen-lg',
      xl: 'tw:max-w-screen-xl',
    } as const;

    Object.entries(sizes).forEach(([size, expected]) => {
      const { unmount } = render(
        <Container size={size as keyof typeof sizes} data-testid="container">
          content
        </Container>
      );
      expect(screen.getByTestId('container').className).toContain(expected);
      unmount();
    });
  });

  it('does not apply default max-width when size is set', () => {
    render(
      <Container size="lg" data-testid="container">
        content
      </Container>
    );
    expect(screen.getByTestId('container').className).not.toContain('tw:max-w-[976px]');
  });

  it('forwards ref', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Container ref={ref}>ref test</Container>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('merges className', () => {
    render(
      <Container className="extra-class" data-testid="container">
        content
      </Container>
    );
    expect(screen.getByTestId('container').className).toContain('extra-class');
  });

  it('passes through additional HTML attributes', () => {
    render(
      <Container data-testid="container" aria-label="main container">
        content
      </Container>
    );
    expect(screen.getByTestId('container')).toBeInTheDocument();
    expect(screen.getByLabelText('main container')).toBeInTheDocument();
  });
});

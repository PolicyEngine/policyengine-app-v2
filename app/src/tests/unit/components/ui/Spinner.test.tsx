import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Spinner } from '@/components/ui/Spinner';

describe('Spinner', () => {
  it('renders with status role', () => {
    render(<Spinner />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('has accessible sr-only loading text', () => {
    render(<Spinner />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('applies default md size', () => {
    render(<Spinner />);
    const el = screen.getByRole('status');
    expect(el.className).toContain('tw:h-8');
    expect(el.className).toContain('tw:w-8');
  });

  it('applies size variants', () => {
    const sizes = {
      sm: ['tw:h-4', 'tw:w-4'],
      md: ['tw:h-8', 'tw:w-8'],
      lg: ['tw:h-12', 'tw:w-12'],
    } as const;

    Object.entries(sizes).forEach(([size, classes]) => {
      const { unmount } = render(<Spinner size={size as keyof typeof sizes} />);
      const el = screen.getByRole('status');
      classes.forEach((cls) => {
        expect(el.className).toContain(cls);
      });
      unmount();
    });
  });

  it('applies animation class', () => {
    render(<Spinner />);
    expect(screen.getByRole('status').className).toContain('tw:animate-spin');
  });

  it('applies border styling', () => {
    render(<Spinner />);
    const el = screen.getByRole('status');
    expect(el.className).toContain('tw:rounded-full');
    expect(el.className).toContain('tw:border-2');
    expect(el.className).toContain('tw:border-current');
    expect(el.className).toContain('tw:border-t-transparent');
  });

  it('forwards ref', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Spinner ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('merges className', () => {
    render(<Spinner className="custom-spinner" />);
    expect(screen.getByRole('status').className).toContain('custom-spinner');
  });

  it('passes through additional HTML attributes', () => {
    render(<Spinner data-testid="my-spinner" aria-label="loading data" />);
    expect(screen.getByTestId('my-spinner')).toBeInTheDocument();
    expect(screen.getByLabelText('loading data')).toBeInTheDocument();
  });
});

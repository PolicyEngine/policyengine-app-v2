import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Stack } from '@/components/ui/Stack';

describe('Stack', () => {
  it('renders children', () => {
    render(
      <Stack>
        <div>child 1</div>
        <div>child 2</div>
      </Stack>
    );
    expect(screen.getByText('child 1')).toBeInTheDocument();
    expect(screen.getByText('child 2')).toBeInTheDocument();
  });

  it('renders as flex column by default', () => {
    render(<Stack data-testid="stack">content</Stack>);
    const el = screen.getByTestId('stack');
    expect(el.className).toContain('tw:flex');
    expect(el.className).toContain('tw:flex-col');
  });

  it('applies default md gap', () => {
    render(<Stack data-testid="stack">content</Stack>);
    expect(screen.getByTestId('stack').className).toContain('tw:gap-3');
  });

  it('applies gap variants', () => {
    const gaps = {
      xs: 'tw:gap-1',
      sm: 'tw:gap-2',
      md: 'tw:gap-3',
      lg: 'tw:gap-4',
      xl: 'tw:gap-5',
    } as const;

    Object.entries(gaps).forEach(([gap, expected]) => {
      const { unmount } = render(
        <Stack gap={gap as keyof typeof gaps} data-testid="stack">
          content
        </Stack>
      );
      expect(screen.getByTestId('stack').className).toContain(expected);
      unmount();
    });
  });

  it('applies align variants', () => {
    const aligns = {
      start: 'tw:items-start',
      center: 'tw:items-center',
      end: 'tw:items-end',
      stretch: 'tw:items-stretch',
    } as const;

    Object.entries(aligns).forEach(([align, expected]) => {
      const { unmount } = render(
        <Stack align={align as keyof typeof aligns} data-testid="stack">
          content
        </Stack>
      );
      expect(screen.getByTestId('stack').className).toContain(expected);
      unmount();
    });
  });

  it('applies justify variants', () => {
    const justifies = {
      start: 'tw:justify-start',
      center: 'tw:justify-center',
      end: 'tw:justify-end',
      'space-between': 'tw:justify-between',
      'space-around': 'tw:justify-around',
    } as const;

    Object.entries(justifies).forEach(([justify, expected]) => {
      const { unmount } = render(
        <Stack justify={justify as keyof typeof justifies} data-testid="stack">
          content
        </Stack>
      );
      expect(screen.getByTestId('stack').className).toContain(expected);
      unmount();
    });
  });

  it('forwards ref', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Stack ref={ref}>ref test</Stack>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('merges className', () => {
    render(
      <Stack className="custom-class" data-testid="stack">
        content
      </Stack>
    );
    expect(screen.getByTestId('stack').className).toContain('custom-class');
  });

  it('passes through additional HTML attributes', () => {
    render(
      <Stack data-testid="stack" aria-label="accessible stack">
        content
      </Stack>
    );
    expect(screen.getByTestId('stack')).toBeInTheDocument();
    expect(screen.getByLabelText('accessible stack')).toBeInTheDocument();
  });
});

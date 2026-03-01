import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Group } from '@/components/ui/Group';

describe('Group', () => {
  it('renders children', () => {
    render(
      <Group>
        <span>A</span>
        <span>B</span>
      </Group>
    );
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
  });

  it('renders as flex row by default', () => {
    render(<Group data-testid="group">content</Group>);
    const el = screen.getByTestId('group');
    expect(el.className).toContain('tw:flex');
    expect(el.className).toContain('tw:flex-row');
  });

  it('applies default md gap', () => {
    render(<Group data-testid="group">content</Group>);
    expect(screen.getByTestId('group').className).toContain('tw:gap-3');
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
        <Group gap={gap as keyof typeof gaps} data-testid="group">
          content
        </Group>
      );
      expect(screen.getByTestId('group').className).toContain(expected);
      unmount();
    });
  });

  it('applies justify variants including apart', () => {
    const justifies = {
      start: 'tw:justify-start',
      center: 'tw:justify-center',
      end: 'tw:justify-end',
      'space-between': 'tw:justify-between',
      apart: 'tw:justify-between',
    } as const;

    Object.entries(justifies).forEach(([justify, expected]) => {
      const { unmount } = render(
        <Group justify={justify as keyof typeof justifies} data-testid="group">
          content
        </Group>
      );
      expect(screen.getByTestId('group').className).toContain(expected);
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
        <Group align={align as keyof typeof aligns} data-testid="group">
          content
        </Group>
      );
      expect(screen.getByTestId('group').className).toContain(expected);
      unmount();
    });
  });

  it('defaults to center alignment', () => {
    render(<Group data-testid="group">content</Group>);
    expect(screen.getByTestId('group').className).toContain('tw:items-center');
  });

  it('applies wrap by default', () => {
    render(<Group data-testid="group">content</Group>);
    expect(screen.getByTestId('group').className).toContain('tw:flex-wrap');
  });

  it('applies nowrap', () => {
    render(
      <Group wrap="nowrap" data-testid="group">
        content
      </Group>
    );
    expect(screen.getByTestId('group').className).toContain('tw:flex-nowrap');
  });

  it('applies grow', () => {
    render(
      <Group grow data-testid="group">
        content
      </Group>
    );
    expect(screen.getByTestId('group').className).toContain('[&>*]:tw:flex-1');
  });

  it('forwards ref', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Group ref={ref}>ref test</Group>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('merges className', () => {
    render(
      <Group className="extra" data-testid="group">
        content
      </Group>
    );
    expect(screen.getByTestId('group').className).toContain('extra');
  });

  it('passes through additional HTML attributes', () => {
    render(
      <Group data-testid="group" aria-label="group label">
        content
      </Group>
    );
    expect(screen.getByTestId('group')).toBeInTheDocument();
    expect(screen.getByLabelText('group label')).toBeInTheDocument();
  });
});

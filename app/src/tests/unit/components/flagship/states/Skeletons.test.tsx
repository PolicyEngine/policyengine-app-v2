import { render, screen } from '@test-utils';
import { describe, expect, test } from 'vitest';
import { CardGridSkeleton, SkeletonLine, SkeletonRegion } from '@/components/flagship/states';

describe('SkeletonRegion', () => {
  test('given a label then the region is a busy status named for what is loading', () => {
    render(
      <SkeletonRegion label="Loading the bill">
        <SkeletonLine />
      </SkeletonRegion>
    );

    const region = screen.getByRole('status', { name: 'Loading the bill' });
    expect(region).toHaveAttribute('aria-busy', 'true');
  });
});

describe('CardGridSkeleton', () => {
  test('given a count then that many placeholder cards fill the grid', () => {
    render(<CardGridSkeleton label="Loading bills" count={4} />);

    const grid = screen.getByRole('status', { name: 'Loading bills' });
    expect(grid.children).toHaveLength(4);
  });

  test('given no count then a page of six cards stands in', () => {
    render(<CardGridSkeleton label="Loading your reforms" />);

    expect(screen.getByRole('status', { name: 'Loading your reforms' }).children).toHaveLength(6);
  });
});

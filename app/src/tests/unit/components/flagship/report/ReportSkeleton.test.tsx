import { render, screen } from '@test-utils';
import { describe, expect, test } from 'vitest';
import ReportSkeleton from '@/components/flagship/report/ReportSkeleton';
import { RunLoading } from '@/components/flagship/report/RunProgress';

describe('ReportSkeleton', () => {
  test('given a report on its way then one busy status names it, with no headings yet', () => {
    render(<ReportSkeleton label="Loading the bill" />);

    expect(screen.getByRole('status', { name: 'Loading the bill' })).toHaveAttribute(
      'aria-busy',
      'true'
    );
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });
});

describe('RunLoading', () => {
  test('given a run not yet started then a spinner stands in, named for what loads', () => {
    render(<RunLoading label="Loading report" />);

    expect(screen.getAllByRole('status')).toEqual([
      screen.getByRole('status', { name: 'Loading report' }),
    ]);
    expect(screen.getByText('Loading report…')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });
});

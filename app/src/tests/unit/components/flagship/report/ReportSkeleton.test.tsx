import { render, screen } from '@test-utils';
import { describe, expect, test } from 'vitest';
import ReportSkeleton from '@/components/flagship/report/ReportSkeleton';
import RunProgress, { RunProgressSkeleton } from '@/components/flagship/report/RunProgress';

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

describe('RunProgressSkeleton', () => {
  test('given a run not yet started then its card stands in, named for what loads', () => {
    render(<RunProgressSkeleton label="Loading report" />);

    expect(screen.getByRole('status', { name: 'Loading report' })).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  test('given the run then starts then the card has the same frame as its placeholder', () => {
    const { container: placeholder } = render(<RunProgressSkeleton label="Loading report" />);
    const { container: run } = render(
      <RunProgress title="Calculating the nationwide results" progress={20} expectedMs={60_000} />
    );

    const frame = (element: Element) => {
      const style = (element.firstElementChild as HTMLElement).style;
      return [style.maxWidth, style.padding, style.border, style.borderRadius];
    };
    expect(frame(placeholder)).toEqual(frame(run));
  });
});

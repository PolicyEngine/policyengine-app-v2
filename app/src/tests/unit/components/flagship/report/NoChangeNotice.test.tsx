import { render, screen } from '@test-utils';
import { describe, expect, test } from 'vitest';
import NoChangeNotice from '@/components/flagship/report/NoChangeNotice';
import type { RunReportProvision } from '@/libs/flagship/runReport';

const FOREVER = '2100-12-31';

const provision = (overrides: Partial<RunReportProvision>): RunReportProvision => ({
  path: 'gov.irs.credits.ctc.refundable.individual_max',
  breadcrumb: 'IRS → Credits → Child tax credit → Refundable maximum',
  unit: 'currency-USD',
  baselineValue: 1700,
  value: 1700,
  ...overrides,
});

describe('NoChangeNotice', () => {
  test('given a change that starts after the report year then it names the provision and its start', () => {
    render(
      <NoChangeNotice
        year="2026"
        provisions={[
          provision({ intervals: [{ startDate: '2028-01-01', endDate: FOREVER, value: 2000 }] }),
        ]}
      />
    );

    const notice = screen.getByRole('region', { name: 'No change in this year' });
    expect(notice).toHaveTextContent('This reform changes nothing in 2026');
    expect(notice).toHaveTextContent('The likely reason:');
    expect(notice).toHaveTextContent('changes from 2028, after this 2026 report.');
    // A dated reason stands alone: no guesswork beside it.
    expect(notice).not.toHaveTextContent('not in effect');
  });

  test('given a change that ended before the report year then it says until when', () => {
    render(
      <NoChangeNotice
        year="2026"
        provisions={[
          provision({
            intervals: [{ startDate: '2023-01-01', endDate: '2024-12-31', value: 2000 }],
          }),
        ]}
      />
    );

    expect(screen.getByRole('region', { name: 'No change in this year' })).toHaveTextContent(
      'changes only until 2024, before this 2026 report.'
    );
  });

  test('given no dates to explain it then it gives the likely reasons', () => {
    render(<NoChangeNotice year="2026" provisions={[provision({})]} />);

    const notice = screen.getByRole('region', { name: 'No change in this year' });
    expect(notice).toHaveTextContent('Likely reasons:');
    expect(notice).toHaveTextContent('A changed value is at current law in 2026.');
    expect(notice).toHaveTextContent('A program you changed is not in effect in 2026');
  });

  test('given a report compared with a saved reform then it names that, not current law', () => {
    render(
      <NoChangeNotice
        year="2026"
        provisions={[provision({ value: 2000 })]}
        baselineLabel="Plan B"
      />
    );

    const notice = screen.getByRole('region', { name: 'No change in this year' });
    expect(notice).toHaveTextContent('Every result matches Plan B.');
    expect(notice).not.toHaveTextContent('matches current law');
    expect(notice).toHaveTextContent('The reform sets the same values as Plan B in 2026.');
  });

  test('given a saved reform then the reasons are only those that compare with it', () => {
    render(
      <NoChangeNotice
        year="2026"
        provisions={[
          // Dated after the year, and at current law: reasons against current law only.
          provision({ intervals: [{ startDate: '2028-01-01', endDate: FOREVER, value: 2000 }] }),
          provision({ path: 'gov.irs.credits.eitc.max', value: 600, baselineValue: 600 }),
        ]}
        baselineLabel="Plan B"
      />
    );

    const notice = screen.getByRole('region', { name: 'No change in this year' });
    expect(notice).toHaveTextContent('Likely reasons:');
    expect(notice).toHaveTextContent('The reform sets the same values as Plan B in 2026.');
    expect(notice).toHaveTextContent('A program you changed is not in effect in 2026');
    expect(notice).not.toHaveTextContent('changes from 2028');
    expect(notice).not.toHaveTextContent('at current law');
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  test('given no baseline then it reads current law, as before', () => {
    render(<NoChangeNotice year="2026" provisions={[provision({ value: 2000 })]} />);

    const notice = screen.getByRole('region', { name: 'No change in this year' });
    expect(notice).toHaveTextContent('Every result matches current law. The likely reason:');
    expect(notice).not.toHaveTextContent('same values as');
  });
});

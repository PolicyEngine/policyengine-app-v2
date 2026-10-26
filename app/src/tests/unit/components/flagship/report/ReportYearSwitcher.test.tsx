import { render, screen, userEvent } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import ReportYearSwitcher, { ALL_YEARS } from '@/components/flagship/report/ReportYearSwitcher';

describe('ReportYearSwitcher', () => {
  test('given a window then all years and each year are choices, each year saying where it stands', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ReportYearSwitcher
        years={['2026', '2027', '2028']}
        value={ALL_YEARS}
        onChange={onChange}
        statusByYear={{ '2026': 'done', '2027': 'computing' }}
      />
    );

    expect(screen.getByRole('tab', { name: 'All years, 2026–2028' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    expect(screen.getByRole('tab', { name: '2026, results ready' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '2027, calculating' })).toBeInTheDocument();
    // A year never opened has not run.
    await user.click(screen.getByRole('tab', { name: '2028, not calculated yet' }));

    expect(onChange).toHaveBeenCalledWith('2028');
  });

  test('given a UK window then each year reads as its fiscal year', () => {
    render(
      <ReportYearSwitcher
        years={['2026', '2027']}
        value="2026"
        onChange={vi.fn()}
        statusByYear={{ '2026': 'done' }}
        countryId="uk"
      />
    );

    expect(screen.getByRole('tab', { name: 'All years, 2026-27 to 2027-28' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '2026-27, results ready' })).toHaveTextContent(
      '2026-27'
    );
  });
});

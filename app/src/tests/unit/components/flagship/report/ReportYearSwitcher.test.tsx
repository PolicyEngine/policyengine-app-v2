import { render, screen, userEvent } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import ReportYearSwitcher from '@/components/flagship/report/ReportYearSwitcher';

describe('ReportYearSwitcher', () => {
  test('given a window then each year is a choice, and picking one says so', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ReportYearSwitcher years={['2026', '2027', '2028']} value="2026" onChange={onChange} />
    );

    const group = screen.getByRole('group', { name: 'Results year' });
    expect(group).toHaveTextContent('202620272028');
    await user.click(screen.getByRole('tab', { name: '2027' }));

    expect(onChange).toHaveBeenCalledWith('2027');
  });
});

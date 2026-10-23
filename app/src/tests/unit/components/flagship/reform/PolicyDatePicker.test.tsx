import { useState } from 'react';
import { render, screen, userEvent } from '@test-utils';
import { describe, expect, test } from 'vitest';
import PolicyDatePicker from '@/components/flagship/reform/PolicyDatePicker';
import { FOREVER } from '@/constants';

function Harness({ initial = '2026-01-01' }: { initial?: string }) {
  const [value, setValue] = useState(initial);
  return (
    <PolicyDatePicker
      label="From"
      value={value}
      onChange={setValue}
      minDate="2022-01-01"
      maxDate="2035-12-31"
      rangeStart={value === FOREVER ? '2026-01-01' : value}
      rangeEnd="2026-12-31"
      presets={[
        { label: 'Jul 1, 2026', value: '2026-07-01' },
        { label: 'No end date', value: FOREVER },
      ]}
    />
  );
}

describe('PolicyDatePicker', () => {
  test('given the year menu then a date years away is two picks, not a walk by month', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole('button', { name: 'From: Jan 1, 2026' }));
    await user.selectOptions(screen.getByLabelText('Year'), '2030');
    await user.selectOptions(screen.getByLabelText('Month'), '9');
    await user.click(screen.getByRole('button', { name: 'October 1, 2030' }));

    expect(screen.getByRole('button', { name: 'From: Oct 1, 2030' })).toBeInTheDocument();
  });

  test('given the UK then dates read day first', async () => {
    const user = userEvent.setup();
    render(<Harness />, 'uk');

    await user.click(screen.getByRole('button', { name: 'From: 1 Jan 2026' }));
    await user.selectOptions(screen.getByLabelText('Month'), '3');
    await user.click(screen.getByRole('button', { name: '6 April 2026' }));

    expect(screen.getByRole('button', { name: 'From: 6 Apr 2026' })).toBeInTheDocument();
  });

  test('given the US then weeks start on Sunday', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole('button', { name: 'From: Jan 1, 2026' }));

    expect(screen.getAllByText(/^(Su|Mo|Tu|We|Th|Fr|Sa)$/).map((cell) => cell.textContent)).toEqual(
      ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
    );
    // January 2026 opens on a Thursday: the grid starts on the Sunday before.
    expect(screen.getByRole('button', { name: 'December 28, 2025' })).toBeInTheDocument();
  });

  test('given the UK then weeks start on Monday', async () => {
    const user = userEvent.setup();
    render(<Harness />, 'uk');

    await user.click(screen.getByRole('button', { name: 'From: 1 Jan 2026' }));

    expect(screen.getAllByText(/^(Su|Mo|Tu|We|Th|Fr|Sa)$/).map((cell) => cell.textContent)).toEqual(
      ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
    );
    expect(screen.getByRole('button', { name: '29 December 2025' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '28 December 2025' })).not.toBeInTheDocument();
  });

  test('given the UK and a month that opens on a Monday then no earlier week shows', async () => {
    const user = userEvent.setup();
    render(<Harness />, 'uk');

    await user.click(screen.getByRole('button', { name: 'From: 1 Jan 2026' }));
    // June 2026 opens on a Monday.
    await user.selectOptions(screen.getByLabelText('Month'), '5');

    expect(screen.getByRole('button', { name: '1 June 2026' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '31 May 2026' })).not.toBeInTheDocument();
  });

  test('given a preset then it is chosen in one click', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole('button', { name: 'From: Jan 1, 2026' }));
    await user.click(screen.getByRole('button', { name: 'No end date' }));

    expect(screen.getByRole('button', { name: 'From: No end date' })).toBeInTheDocument();
  });

  test('given dates outside the model years then they cannot be picked', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole('button', { name: 'From: Jan 1, 2026' }));
    await user.selectOptions(screen.getByLabelText('Year'), '2022');
    await user.selectOptions(screen.getByLabelText('Month'), '0');

    expect(screen.getByRole('button', { name: 'Previous month' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'December 31, 2021' })).toBeDisabled();
  });
});

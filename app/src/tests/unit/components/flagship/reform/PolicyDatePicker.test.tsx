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

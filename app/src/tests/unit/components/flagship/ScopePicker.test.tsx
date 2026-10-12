import { render, screen, userEvent } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import ScopePicker, { scopeFilter } from '@/components/flagship/ScopePicker';

const STATES = [
  { code: 'ca', label: 'California' },
  { code: 'nc', label: 'North Carolina' },
  { code: 'ky', label: 'Kentucky' },
  { code: 'ut', label: 'Utah' },
];

describe('scopeFilter', () => {
  test('given a state code then only that state matches', () => {
    expect(scopeFilter('Utah', 'ut', ['ut'])).toBe(1);
    expect(scopeFilter('Kentucky', 'ut', ['ky'])).toBe(0);
    expect(scopeFilter('All jurisdictions', 'ut')).toBe(0);
  });

  test('given the start of any word then the label matches', () => {
    expect(scopeFilter('California', 'calif', ['ca'])).toBeGreaterThan(0);
    expect(scopeFilter('North Carolina', 'car', ['nc'])).toBeGreaterThan(0);
    expect(scopeFilter('Federal only', 'fed')).toBeGreaterThan(0);
  });

  test('given an empty search then everything matches', () => {
    expect(scopeFilter('Utah', '  ', ['ut'])).toBe(1);
  });
});

describe('ScopePicker', () => {
  test('given a value then the trigger names it', () => {
    render(<ScopePicker value="ut" onChange={vi.fn()} states={STATES} triggerStyle={{}} />);

    expect(screen.getByRole('button', { name: 'State scope: Utah' })).toBeInTheDocument();
  });

  test('given the picker is opened then jurisdictions and states are listed', async () => {
    const user = userEvent.setup();
    render(<ScopePicker value="all" onChange={vi.fn()} states={STATES} triggerStyle={{}} />);

    await user.click(screen.getByRole('button', { name: /state scope/i }));

    expect(screen.getByRole('option', { name: /^all jurisdictions/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /^federal only/i })).toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(2 + STATES.length);
  });

  test('given a code is typed then enter picks that state', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ScopePicker value="all" onChange={onChange} states={STATES} triggerStyle={{}} />);

    await user.click(screen.getByRole('button', { name: /state scope/i }));
    await user.type(screen.getByRole('combobox', { name: /find a state/i }), 'ut');

    expect(screen.getAllByRole('option')).toHaveLength(1);
    await user.keyboard('{Enter}');
    expect(onChange).toHaveBeenCalledWith('ut');
  });
});

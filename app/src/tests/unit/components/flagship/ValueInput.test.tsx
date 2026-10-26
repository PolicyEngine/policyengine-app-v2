import { render, screen, userEvent } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import ValueInput from '@/components/flagship/ValueInput';

describe('ValueInput', () => {
  test('given a boolean then it is a switch labelled true or false', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ValueInput value={false} onChange={onChange} ariaLabel="Reform in effect" />);

    const toggle = screen.getByRole('switch', { name: 'Reform in effect' });
    expect(toggle).not.toBeChecked();
    expect(screen.getByText('false')).toBeInTheDocument();

    await user.click(toggle);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  test('given a true boolean then the switch is on and says true', () => {
    render(<ValueInput value onChange={vi.fn()} ariaLabel="Reform in effect" />);

    expect(screen.getByRole('switch', { name: 'Reform in effect' })).toBeChecked();
    expect(screen.getByText('true')).toBeInTheDocument();
  });

  test('given a number then it is a number box', () => {
    render(<ValueInput value={1750} onChange={vi.fn()} ariaLabel="Tip exclusion cap" />);

    expect(screen.getByRole('spinbutton', { name: 'Tip exclusion cap' })).toHaveValue(1750);
  });
});

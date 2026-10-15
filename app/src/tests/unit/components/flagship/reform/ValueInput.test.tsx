import { useState } from 'react';
import { render, screen, userEvent } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import ValueInput, { ValueDisplay } from '@/components/flagship/reform/ValueInput';
import { ParameterMetadata } from '@/types/metadata/parameterMetadata';

const param = (unit: string) =>
  ({
    parameter: 'gov.test',
    label: 'Test',
    type: 'parameter',
    unit,
    values: {},
  }) as ParameterMetadata;

function Harness({
  unit,
  initial,
  onCommit,
}: {
  unit: string;
  /** A number, or "Infinity" for no limit, as metadata sends it. */
  initial: number | string;
  onCommit: (v: any) => void;
}) {
  const [value, setValue] = useState<any>(initial);
  return (
    <ValueInput
      param={param(unit)}
      value={value}
      onChange={(next) => {
        setValue(next);
        onCommit(next);
      }}
    />
  );
}

describe('ValueInput', () => {
  test('given the last digit is deleted then the field empties instead of keeping it', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(<Harness unit="currency-USD" initial={12} onCommit={onCommit} />);
    const box = screen.getByRole('spinbutton');

    await user.click(box);
    await user.type(box, '{End}{Backspace}{Backspace}');

    expect(box).toHaveValue(null);
    expect(onCommit).toHaveBeenLastCalledWith(1);
  });

  test('given an empty field is left then it means 0', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(<Harness unit="currency-USD" initial={12} onCommit={onCommit} />);
    const box = screen.getByRole('spinbutton');

    await user.clear(box);
    await user.tab();

    expect(onCommit).toHaveBeenLastCalledWith(0);
    expect(box).toHaveValue(0);
  });

  test('given a rate then it shows as a clean percentage and stores as a fraction', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(<Harness unit="/1" initial={0.0765} onCommit={onCommit} />);
    const box = screen.getByRole('spinbutton');

    expect(box).toHaveValue(7.65);
    await user.clear(box);
    await user.type(box, '8');

    expect(onCommit).toHaveBeenLastCalledWith(0.08);
  });

  test('given a new value is finished then a check says it is kept', async () => {
    const user = userEvent.setup();
    render(<Harness unit="currency-USD" initial={12} onCommit={vi.fn()} />);
    const box = screen.getByRole('spinbutton');

    await user.clear(box);
    await user.type(box, '15');
    await user.tab();

    expect(screen.getByRole('status')).toHaveTextContent('Saved');
  });

  test('given Enter then the edit finishes and is confirmed', async () => {
    const user = userEvent.setup();
    render(<Harness unit="currency-USD" initial={12} onCommit={vi.fn()} />);
    const box = screen.getByRole('spinbutton');

    await user.clear(box);
    await user.type(box, '20{Enter}');

    expect(box).not.toHaveFocus();
    expect(screen.getByRole('status')).toHaveTextContent('Saved');
  });

  test('given a visit without a change then nothing claims to be saved', async () => {
    const user = userEvent.setup();
    render(<Harness unit="currency-USD" initial={12} onCommit={vi.fn()} />);

    await user.click(screen.getByRole('spinbutton'));
    await user.tab();

    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  test('given no limit then the box says so, and a visit without typing keeps it', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(<Harness unit="currency-USD" initial="Infinity" onCommit={onCommit} />);
    const box = screen.getByRole('spinbutton');

    expect(box).toHaveValue(null);
    expect(box).toHaveAttribute('placeholder', 'No limit');
    await user.click(box);
    await user.tab();

    // An empty box means 0 elsewhere; here it is the limit left unset.
    expect(onCommit).not.toHaveBeenCalled();
  });

  test('given no limit then typing a number sets a limit', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(<Harness unit="currency-USD" initial="Infinity" onCommit={onCommit} />);

    await user.type(screen.getByRole('spinbutton'), '150000');

    expect(onCommit).toHaveBeenLastCalledWith(150000);
  });
});

describe('ValueDisplay', () => {
  test('given no limit then it reads as no limit, not as the text Infinity', () => {
    render(<ValueDisplay param={param('currency-USD')} value="Infinity" />);

    expect(screen.getByText('No limit')).toBeInTheDocument();
  });
});

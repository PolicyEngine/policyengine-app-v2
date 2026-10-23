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
  /** A number, "Infinity" for no limit, or null for a formula, as metadata sends it. */
  initial: number | string | null;
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

  test('given a click inside the digits then typing replaces the whole number', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(<Harness unit="currency-GBP" initial={346.366589511} onCommit={onCommit} />);
    const box = screen.getByRole('spinbutton') as HTMLInputElement;

    await user.click(box);
    expect(box.selectionStart ?? 0).toBe(0);
    await user.keyboard('338.58');

    expect(box).toHaveValue(338.58);
    expect(onCommit).toHaveBeenLastCalledWith(338.58);
  });

  test('given an uprated amount of money then the box shows it to the penny', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(<Harness unit="currency-GBP" initial={346.366589511} onCommit={onCommit} />);
    const box = screen.getByRole('spinbutton');

    expect(box).toHaveValue(346.37);
    await user.click(box);
    expect(box).toHaveValue(346.37);
    await user.tab();

    // Looking at the value does not change it.
    expect(onCommit).not.toHaveBeenCalled();
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

  test('given a negative amount then the sign leads the symbol, as formatValue writes it', () => {
    render(<ValueDisplay param={param('currency-GBP')} value={-5} />);

    expect(screen.getByText('−£5')).toBeInTheDocument();
    expect(screen.queryByText('£')).not.toBeInTheDocument();
  });

  test('given a positive amount then the symbol keeps its own column', () => {
    render(<ValueDisplay param={param('currency-GBP')} value={1250} />);

    expect(screen.getByText('£')).toBeInTheDocument();
    expect(screen.getByText('1,250')).toBeInTheDocument();
  });

  test('given an amount current law leaves to a formula then the empty box says so', () => {
    render(<Harness unit="currency-GBP" initial={null} onCommit={vi.fn()} />);

    const box = screen.getByRole('spinbutton');
    expect(box).toHaveValue(null);
    expect(box).toHaveAttribute('placeholder', 'Set by formula');
  });

  test('given a formula box is left empty then it stays a formula, not 0', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(<Harness unit="currency-GBP" initial={null} onCommit={onCommit} />);

    await user.click(screen.getByRole('spinbutton'));
    await user.tab();

    expect(onCommit).not.toHaveBeenCalled();
  });

  test('given a number is typed into a formula box then it is set', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(<Harness unit="currency-GBP" initial={null} onCommit={onCommit} />);

    await user.type(screen.getByRole('spinbutton'), '429.8');

    expect(onCommit).toHaveBeenLastCalledWith(429.8);
  });

  test('given a formula value then the read-only display says so', () => {
    render(<ValueDisplay param={param('currency-GBP')} value={null} />);

    expect(screen.getByText('Set by formula')).toBeInTheDocument();
  });

  test('given an uprated amount then it shows pence, not the raw float', () => {
    render(<ValueDisplay param={param('currency-GBP')} value={346.366589511} />);

    expect(screen.getByText('346.37')).toBeInTheDocument();
  });
});

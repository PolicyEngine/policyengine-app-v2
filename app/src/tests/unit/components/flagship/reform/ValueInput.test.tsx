import { useState } from 'react';
import { render, screen, userEvent } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import ValueInput from '@/components/flagship/reform/ValueInput';
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
  initial: number;
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
});

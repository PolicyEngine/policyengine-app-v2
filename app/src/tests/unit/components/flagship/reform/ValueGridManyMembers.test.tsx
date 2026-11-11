import { render, screen, userEvent, within } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import ValueGrid from '@/components/flagship/reform/ValueGrid';
import type { ParameterMetadataCollection } from '@/types/metadata/parameterMetadata';

const CODES = ['WY', 'AK', 'AL', 'AZ', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'MT', 'PR'];
const path = (code: string) => `gov.usda.snap.emergency_allotment.in_effect.${code}`;
const PARAMETERS = Object.fromEntries(
  CODES.map((code) => [
    path(code),
    {
      parameter: path(code),
      label: code,
      type: 'parameter',
      unit: 'bool',
      values: { '2020-01-01': false },
    },
  ])
) as unknown as ParameterMetadataCollection;

function renderGrid() {
  return render(
    <ValueGrid
      members={CODES.map((code) => ({ path: path(code), label: code }))}
      years={[2026]}
      openEnded
      parameters={PARAMETERS}
      // Montana is changed to true; every other state stays at current law.
      valueAt={(p) => p === path('MT')}
      baselineAt={() => false}
      onChange={vi.fn()}
      focusedPath=""
      onFocus={vi.fn()}
    />
  );
}

describe('ValueGrid with many members', () => {
  test('given a value per state then each reads by name, in order, territories last', () => {
    renderGrid();
    const names = screen
      .getAllByLabelText(/, 2026$/)
      .map((cell) => cell.getAttribute('aria-label')?.replace(', 2026', ''));
    expect(names).toHaveLength(CODES.length);
    expect(names[0]).toBe('Alabama');
    expect(names[1]).toBe('Alaska');
    expect(names[names.length - 1]).toBe('Puerto Rico');
    expect(screen.queryByText('Ak')).not.toBeInTheDocument();
  });

  test('given a filter then only matching values show', async () => {
    const user = userEvent.setup();
    renderGrid();
    await user.type(screen.getByLabelText('Filter the values'), 'mont');
    expect(
      screen.getAllByLabelText(/, 2026$/).map((cell) => cell.getAttribute('aria-label'))
    ).toEqual(['Montana, 2026']);
  });

  test('given Changed only then the changed value shows with its current law', async () => {
    const user = userEvent.setup();
    renderGrid();
    await user.click(screen.getByLabelText('Changed only (1)'));
    const cells = screen.getAllByLabelText(/, 2026$/);
    expect(cells).toHaveLength(1);
    expect(within(cells[0]).getByText('Current law: false')).toBeInTheDocument();
  });

  test('given a yes/no value stored as 0 then it is a switch too, unchanged until switched', () => {
    const parameters = {
      ...PARAMETERS,
      [path('PR')]: { ...PARAMETERS[path('PR')], values: { '0000-01-01': 0 } },
    } as unknown as ParameterMetadataCollection;
    render(
      <ValueGrid
        members={CODES.map((code) => ({ path: path(code), label: code }))}
        years={[2026]}
        openEnded
        parameters={parameters}
        valueAt={(p) => (p === path('PR') ? 0 : false)}
        baselineAt={(p) => (p === path('PR') ? 0 : false)}
        onChange={vi.fn()}
        focusedPath=""
        onFocus={vi.fn()}
      />
    );
    const cell = screen.getByLabelText('Puerto Rico, 2026');
    expect(within(cell).getByRole('switch', { name: 'Puerto Rico' })).not.toBeChecked();
    expect(within(cell).getByText('False')).toBeInTheDocument();
    expect(screen.getByLabelText('Changed only (0)')).toBeInTheDocument();
  });

  test('given several years then the table names the states, filters them, and uses switches', async () => {
    const user = userEvent.setup();
    render(
      <ValueGrid
        members={CODES.map((code) => ({ path: path(code), label: code }))}
        years={[2026, 2027]}
        openEnded
        parameters={PARAMETERS}
        valueAt={(p) => p === path('MT')}
        baselineAt={() => false}
        onChange={vi.fn()}
        focusedPath=""
        onFocus={vi.fn()}
      />
    );
    expect(screen.getAllByRole('rowheader')[0]).toHaveTextContent('Alabama');
    expect(screen.getByRole('switch', { name: 'Montana, 2027' })).toBeChecked();

    await user.type(screen.getByLabelText('Filter the values'), 'ala');
    expect(screen.getAllByRole('rowheader').map((row) => row.textContent)).toEqual([
      'Alabama',
      'Alaska',
    ]);
  });

  test('given parts of a state then each reads as the state and its part', () => {
    const keys = [...CODES, 'NY_NYC', 'NY_NAS'];
    const parameters = Object.fromEntries(
      keys.map((code) => [
        path(code),
        { ...PARAMETERS[path('AK')], parameter: path(code), label: code },
      ])
    ) as unknown as ParameterMetadataCollection;
    render(
      <ValueGrid
        members={keys.map((code) => ({ path: path(code), label: code }))}
        years={[2026]}
        openEnded
        parameters={parameters}
        valueAt={() => false}
        baselineAt={() => false}
        onChange={vi.fn()}
        focusedPath=""
        onFocus={vi.fn()}
      />
    );
    expect(screen.getByLabelText('New York (NYC), 2026')).toBeInTheDocument();
    expect(screen.getByLabelText('New York (NAS), 2026')).toBeInTheDocument();
  });
});

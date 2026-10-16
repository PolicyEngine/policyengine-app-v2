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
});

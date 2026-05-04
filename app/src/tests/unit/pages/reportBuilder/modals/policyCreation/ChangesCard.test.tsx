import { render, screen, userEvent } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import { ChangesCard } from '@/pages/reportBuilder/modals/policyCreation/ChangesCard';
import type { ModifiedParam } from '@/pages/reportBuilder/modals/policyCreation/types';

const modifiedParams: ModifiedParam[] = [
  {
    paramName: 'gov.test.parameter',
    label: 'Test parameter',
    changes: [
      { index: 0, period: '2024', value: '$100' },
      { index: 1, period: '2025', value: '$200' },
    ],
  },
];

describe('ChangesCard', () => {
  test('given editable changes then removes the selected interval by index', async () => {
    const user = userEvent.setup();
    const handleRemoveChange = vi.fn();

    render(<ChangesCard modifiedParams={modifiedParams} onRemoveChange={handleRemoveChange} />);

    await user.click(screen.getByRole('button', { name: /remove 2025 change/i }));

    expect(handleRemoveChange).toHaveBeenCalledWith('gov.test.parameter', 1);
  });

  test('given read-only mode then does not render remove actions', () => {
    render(<ChangesCard modifiedParams={modifiedParams} isReadOnly onRemoveChange={vi.fn()} />);

    expect(screen.queryByRole('button', { name: /remove 2025 change/i })).not.toBeInTheDocument();
  });

  test('renders the production-style interval rows without the parameter label', () => {
    render(<ChangesCard modifiedParams={modifiedParams} onRemoveChange={vi.fn()} />);

    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('2024')).toBeInTheDocument();
    expect(screen.getByText('$100')).toBeInTheDocument();
    expect(screen.queryByText('Test parameter')).not.toBeInTheDocument();
  });
});

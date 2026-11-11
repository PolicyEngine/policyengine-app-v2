import { render, screen, userEvent } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import { PolicyDetailsDrawer } from '@/pages/reportBuilder/modals/policy/PolicyDetailsDrawer';

describe('PolicyDetailsDrawer', () => {
  test('given an errored policy then select and edit are disabled', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onEdit = vi.fn();

    render(
      <PolicyDetailsDrawer
        policy={{
          id: 'policy-123',
          label: 'Broken policy',
          paramCount: 0,
          parameters: [],
          isDisabled: true,
          errorMessage: 'Error loading this policy',
        }}
        parameters={{}}
        parameterTree={null}
        onClose={vi.fn()}
        onSelect={onSelect}
        onEdit={onEdit}
      />
    );

    expect(screen.getAllByLabelText('Error loading this policy')).toHaveLength(2);
    expect(screen.getByText('Failed to load this policy')).toBeInTheDocument();

    const selectButton = screen.getByRole('button', { name: /select this policy/i });
    const editButton = screen.getByRole('button', { name: /edit policy/i });
    expect(selectButton).toBeDisabled();
    expect(editButton).toBeDisabled();

    await user.click(selectButton);
    await user.click(editButton);
    expect(onSelect).not.toHaveBeenCalled();
    expect(onEdit).not.toHaveBeenCalled();
  });
});

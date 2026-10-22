import { render, screen, userEvent } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import DeleteConfirmationDialog from '@/components/flagship/DeleteConfirmationDialog';

const ITEM_NAME = 'Our family';
const DESCRIPTION = 'This removes it from your households for good.';
const CONFIRM_LABEL = 'Delete household';

function renderDialog(props: Partial<React.ComponentProps<typeof DeleteConfirmationDialog>> = {}) {
  const onConfirm = vi.fn();
  render(
    <DeleteConfirmationDialog
      name={ITEM_NAME}
      description={DESCRIPTION}
      confirmLabel={CONFIRM_LABEL}
      onConfirm={onConfirm}
      {...props}
    />
  );
  return { onConfirm };
}

describe('DeleteConfirmationDialog', () => {
  test('given Delete then it asks first, naming what is deleted and what the delete does', async () => {
    const user = userEvent.setup();
    const { onConfirm } = renderDialog();

    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(screen.getByRole('alertdialog', { name: `Delete “${ITEM_NAME}”?` })).toHaveTextContent(
      DESCRIPTION
    );
    expect(onConfirm).not.toHaveBeenCalled();
  });

  test('given the delete confirmed then it is done', async () => {
    const user = userEvent.setup();
    const { onConfirm } = renderDialog();

    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await user.click(screen.getByRole('button', { name: CONFIRM_LABEL }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  test('given Cancel then nothing is deleted', async () => {
    const user = userEvent.setup();
    const { onConfirm } = renderDialog();

    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  test('given a delete already under way then Delete cannot be pressed', () => {
    renderDialog({ disabled: true });

    expect(screen.getByRole('button', { name: 'Delete' })).toBeDisabled();
  });
});

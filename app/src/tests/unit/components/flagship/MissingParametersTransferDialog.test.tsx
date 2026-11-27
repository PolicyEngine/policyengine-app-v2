import { render, screen, userEvent, within } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import MissingParametersTransferDialog from '@/components/flagship/MissingParametersTransferDialog';
import {
  REMOVED_PARAMETERS,
  REMOVED_US_PARAMETER,
} from '@/tests/fixtures/libs/flagship/missingParametersMocks';

const TRANSFER_LABEL = 'Transfer to a new policy';

function renderDialog(
  overrides: Partial<Parameters<typeof MissingParametersTransferDialog>[0]> = {}
) {
  const props = {
    open: true,
    onOpenChange: vi.fn(),
    subject: 'reform' as const,
    parameterPaths: [REMOVED_US_PARAMETER],
    transferLabel: TRANSFER_LABEL,
    transferNote: 'The reform keeps its name, its baseline and its other changes.',
    onTransfer: vi.fn(),
    ...overrides,
  };
  render(<MissingParametersTransferDialog {...props} />);
  return props;
}

describe('MissingParametersTransferDialog', () => {
  test('given missing parameters then it names each one and says what cannot run', () => {
    // When
    renderDialog({ parameterPaths: REMOVED_PARAMETERS });

    // Then
    const dialog = screen.getByRole('dialog', {
      name: 'This reform uses parameters the model no longer has',
    });
    expect(dialog).toHaveTextContent(/so this reform cannot be run/i);
    for (const path of REMOVED_PARAMETERS) {
      expect(within(dialog).getByText(path)).toBeInTheDocument();
    }
    expect(dialog).toHaveTextContent(
      'The reform keeps its name, its baseline and its other changes.'
    );
  });

  test('given a report then it says so', () => {
    // When
    renderDialog({ subject: 'report', transferLabel: 'Transfer and run again' });

    // Then
    expect(
      screen.getByRole('dialog', { name: 'This report uses parameters the model no longer has' })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Transfer and run again' })).toBeEnabled();
  });

  test('given the dialog then it offers only the transfer and Not now', () => {
    // When
    renderDialog();

    // Then
    const dialog = screen.getByRole('dialog');
    expect(
      within(dialog)
        .getAllByRole('button')
        .map((button) => button.textContent)
    ).toEqual(['Not now', TRANSFER_LABEL]);
    expect(within(dialog).queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
  });

  test('given the transfer clicked then it asks for the transfer', async () => {
    // Given
    const user = userEvent.setup();
    const props = renderDialog();

    // When
    await user.click(screen.getByRole('button', { name: TRANSFER_LABEL }));

    // Then
    expect(props.onTransfer).toHaveBeenCalledTimes(1);
  });

  test('given Not now clicked then it closes without transferring', async () => {
    // Given
    const user = userEvent.setup();
    const props = renderDialog();

    // When
    await user.click(screen.getByRole('button', { name: 'Not now' }));

    // Then
    expect(props.onOpenChange).toHaveBeenCalledWith(false);
    expect(props.onTransfer).not.toHaveBeenCalled();
  });

  test('given nothing would remain then the transfer is off and it says why', () => {
    // When
    renderDialog({ nothingLeft: true });

    // Then
    expect(screen.getByRole('button', { name: TRANSFER_LABEL })).toBeDisabled();
    expect(screen.getByRole('dialog')).toHaveTextContent(
      /without this parameter, this reform changes nothing, so there is nothing to transfer/i
    );
    expect(screen.getByRole('button', { name: 'Not now' })).toBeEnabled();
  });

  test('given a failed transfer then it says so in the dialog', () => {
    // When
    renderDialog({ error: 'Could not transfer the reform. Try again.' });

    // Then
    expect(within(screen.getByRole('dialog')).getByRole('alert')).toHaveTextContent(
      'Could not transfer the reform. Try again.'
    );
    expect(screen.getByRole('button', { name: TRANSFER_LABEL })).toBeEnabled();
  });

  test('given a transfer under way then neither action can be clicked', () => {
    // When
    renderDialog({ transferring: true });

    // Then
    expect(screen.getByRole('button', { name: 'Transferring…' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Not now' })).toBeDisabled();
  });
});

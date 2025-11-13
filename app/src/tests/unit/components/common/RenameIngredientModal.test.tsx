import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, userEvent } from '@test-utils';
import { RenameIngredientModal } from '@/components/common/RenameIngredientModal';
import {
  createDefaultModalProps,
  createLoadingModalProps,
  createClosedModalProps,
  TEST_LABELS,
  INGREDIENT_TYPES,
} from '@/tests/fixtures/components/common/RenameIngredientModalFixtures';

describe('RenameIngredientModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    test('given modal is opened then modal title displays with ingredient type', () => {
      // Given & When
      render(<RenameIngredientModal {...createDefaultModalProps()} />);

      // Then
      expect(screen.getByText(/rename report/i)).toBeInTheDocument();
    });

    test('given modal is closed then modal does not display', () => {
      // Given & When
      render(<RenameIngredientModal {...createClosedModalProps()} />);

      // Then
      expect(screen.queryByText(/rename report/i)).not.toBeInTheDocument();
    });

    test('given simulation type then modal title shows rename simulation', () => {
      // Given
      const props = {
        ...createDefaultModalProps(),
        ingredientType: INGREDIENT_TYPES.SIMULATION as 'simulation',
      };

      // When
      render(<RenameIngredientModal {...props} />);

      // Then
      expect(screen.getByText(/rename simulation/i)).toBeInTheDocument();
    });

    test('given policy type then modal title shows rename policy', () => {
      // Given
      const props = {
        ...createDefaultModalProps(),
        ingredientType: INGREDIENT_TYPES.POLICY as 'policy',
      };

      // When
      render(<RenameIngredientModal {...props} />);

      // Then
      expect(screen.getByText(/rename policy/i)).toBeInTheDocument();
    });

    test('given household type then modal title shows rename household', () => {
      // Given
      const props = {
        ...createDefaultModalProps(),
        ingredientType: INGREDIENT_TYPES.HOUSEHOLD as 'household',
      };

      // When
      render(<RenameIngredientModal {...props} />);

      // Then
      expect(screen.getByText(/rename household/i)).toBeInTheDocument();
    });

    test('given geography type then modal title shows rename geography', () => {
      // Given
      const props = {
        ...createDefaultModalProps(),
        ingredientType: INGREDIENT_TYPES.GEOGRAPHY as 'geography',
      };

      // When
      render(<RenameIngredientModal {...props} />);

      // Then
      expect(screen.getByText(/rename geography/i)).toBeInTheDocument();
    });

    test('given current label then input displays current label value', () => {
      // Given & When
      render(<RenameIngredientModal {...createDefaultModalProps()} />);

      // Then
      const input = screen.getByRole('textbox', { name: /report name/i });
      expect(input).toHaveValue(TEST_LABELS.CURRENT);
    });

    test('given modal is opened then input has autofocus attribute', () => {
      // Given & When
      render(<RenameIngredientModal {...createDefaultModalProps()} />);

      // Then
      const input = screen.getByRole('textbox', { name: /report name/i });
      expect(input).toHaveAttribute('data-autofocus', 'true');
    });

    test('given loading state then rename button has loading indicator', () => {
      // Given & When
      render(<RenameIngredientModal {...createLoadingModalProps()} />);

      // Then
      const button = screen.getByRole('button', { name: /rename/i });
      expect(button).toHaveAttribute('data-loading', 'true');
    });

    test('given loading state then rename button is disabled', () => {
      // Given & When
      render(<RenameIngredientModal {...createLoadingModalProps()} />);

      // Then
      const button = screen.getByRole('button', { name: /rename/i });
      expect(button).toBeDisabled();
    });
  });

  describe('user interactions', () => {
    test('given user types new label then input value updates', async () => {
      // Given
      const user = userEvent.setup();
      render(<RenameIngredientModal {...createDefaultModalProps()} />);
      const input = screen.getByRole('textbox', { name: /report name/i });

      // When
      await user.clear(input);
      await user.type(input, TEST_LABELS.NEW);

      // Then
      expect(input).toHaveValue(TEST_LABELS.NEW);
    });

    test('given user clicks cancel then onClose is called', async () => {
      // Given
      const user = userEvent.setup();
      const props = createDefaultModalProps();
      render(<RenameIngredientModal {...props} />);

      // When
      await user.click(screen.getByRole('button', { name: /cancel/i }));

      // Then
      expect(props.onClose).toHaveBeenCalledOnce();
    });

    test('given user clicks rename with new label then onRename is called with new label', async () => {
      // Given
      const user = userEvent.setup();
      const props = createDefaultModalProps();
      render(<RenameIngredientModal {...props} />);
      const input = screen.getByRole('textbox', { name: /report name/i });

      // When
      await user.clear(input);
      await user.type(input, TEST_LABELS.NEW);
      await user.click(screen.getByRole('button', { name: /^rename$/i }));

      // Then
      expect(props.onRename).toHaveBeenCalledWith(TEST_LABELS.NEW);
    });

    test('given user presses enter with new label then onRename is called', async () => {
      // Given
      const user = userEvent.setup();
      const props = createDefaultModalProps();
      render(<RenameIngredientModal {...props} />);
      const input = screen.getByRole('textbox', { name: /report name/i });

      // When
      await user.clear(input);
      await user.type(input, `${TEST_LABELS.NEW}{Enter}`);

      // Then
      expect(props.onRename).toHaveBeenCalledWith(TEST_LABELS.NEW);
    });

    test('given label unchanged then clicking rename closes modal without calling onRename', async () => {
      // Given
      const user = userEvent.setup();
      const props = createDefaultModalProps();
      render(<RenameIngredientModal {...props} />);

      // When
      await user.click(screen.getByRole('button', { name: /^rename$/i }));

      // Then
      expect(props.onRename).not.toHaveBeenCalled();
      expect(props.onClose).toHaveBeenCalledOnce();
    });

    test('given label with whitespace then trimmed label is submitted', async () => {
      // Given
      const user = userEvent.setup();
      const props = createDefaultModalProps();
      render(<RenameIngredientModal {...props} />);
      const input = screen.getByRole('textbox', { name: /report name/i });

      // When
      await user.clear(input);
      await user.type(input, TEST_LABELS.WITH_SPACES);
      await user.click(screen.getByRole('button', { name: /^rename$/i }));

      // Then
      expect(props.onRename).toHaveBeenCalledWith(TEST_LABELS.TRIMMED);
    });
  });

  describe('validation', () => {
    test('given empty label then rename button is disabled', async () => {
      // Given
      const user = userEvent.setup();
      const props = createDefaultModalProps();
      render(<RenameIngredientModal {...props} />);
      const input = screen.getByRole('textbox', { name: /report name/i });

      // When
      await user.clear(input);

      // Then
      const renameButton = screen.getByRole('button', { name: /^rename$/i });
      expect(renameButton).toBeDisabled();
      expect(props.onRename).not.toHaveBeenCalled();
    });

    test('given label exceeds 100 characters then error message displays', async () => {
      // Given
      const user = userEvent.setup();
      const props = createDefaultModalProps();
      render(<RenameIngredientModal {...props} />);
      const input = screen.getByRole('textbox', { name: /report name/i });

      // When
      await user.clear(input);
      await user.type(input, TEST_LABELS.TOO_LONG);
      await user.click(screen.getByRole('button', { name: /^rename$/i }));

      // Then
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).toHaveAccessibleDescription(/must be 100 characters or less/i);
      expect(props.onRename).not.toHaveBeenCalled();
    });

    test('given whitespace-only label then rename button is disabled', async () => {
      // Given
      const user = userEvent.setup();
      const props = createDefaultModalProps();
      render(<RenameIngredientModal {...props} />);
      const input = screen.getByRole('textbox', { name: /report name/i });

      // When
      await user.clear(input);
      await user.type(input, '   ');

      // Then
      const renameButton = screen.getByRole('button', { name: /^rename$/i });
      expect(renameButton).toBeDisabled();
      expect(props.onRename).not.toHaveBeenCalled();
    });

    test('given valid 100 character label then accepts submission', async () => {
      // Given
      const user = userEvent.setup();
      const props = createDefaultModalProps();
      render(<RenameIngredientModal {...props} />);
      const input = screen.getByRole('textbox', { name: /report name/i });
      const exactly100Chars = 'a'.repeat(100);

      // When
      await user.clear(input);
      await user.type(input, exactly100Chars);
      await user.click(screen.getByRole('button', { name: /^rename$/i }));

      // Then
      expect(props.onRename).toHaveBeenCalledWith(exactly100Chars);
    });
  });

  describe('modal lifecycle', () => {
    test('given modal reopens with new current label then input value resets', () => {
      // Given
      const props = createDefaultModalProps();
      const { rerender } = render(<RenameIngredientModal {...props} />);

      // When - reopen with new label
      rerender(
        <RenameIngredientModal
          {...props}
          opened={false}
        />
      );
      rerender(
        <RenameIngredientModal
          {...props}
          currentLabel={TEST_LABELS.NEW}
          opened={true}
        />
      );

      // Then
      const input = screen.getByRole('textbox', { name: /report name/i });
      expect(input).toHaveValue(TEST_LABELS.NEW);
    });

    test('given modal reopens then error state resets', () => {
      // Given
      const props = createDefaultModalProps();
      const { rerender } = render(<RenameIngredientModal {...props} />);

      // When - close modal (errors should clear on reopen)
      rerender(
        <RenameIngredientModal
          {...props}
          opened={false}
        />
      );
      rerender(
        <RenameIngredientModal
          {...props}
          opened={true}
        />
      );

      // Then
      const input = screen.getByRole('textbox', { name: /report name/i });
      expect(input).toHaveAttribute('aria-invalid', 'false');
    });
  });
});

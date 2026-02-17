import { render, screen, userEvent } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import VariableRow from '@/components/household/VariableRow';
import {
  createMockOnChange,
  createMockOnRemove,
  MOCK_FLOAT_VARIABLE,
  MOCK_INPUT_HOUSEHOLD,
  MOCK_INPUT_METADATA,
  MOCK_INT_VARIABLE,
} from '@/tests/fixtures/components/household/variableRowMocks';

describe('VariableRow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('label display', () => {
    test('given variable then displays label in sentence case', () => {
      // Given
      const onChange = createMockOnChange();

      // When
      render(
        <VariableRow
          variable={MOCK_FLOAT_VARIABLE}
          household={MOCK_INPUT_HOUSEHOLD}
          metadata={MOCK_INPUT_METADATA}
          entityId={0}
          onChange={onChange}
        />
      );

      // Then - sentence case: "Employment income" (first letter caps, rest lowercase)
      expect(screen.getByText('Employment income')).toBeInTheDocument();
    });

    test('given variable then VariableInput does not show duplicate label', () => {
      // Given
      const onChange = createMockOnChange();

      // When
      render(
        <VariableRow
          variable={MOCK_INT_VARIABLE}
          household={MOCK_INPUT_HOUSEHOLD}
          metadata={MOCK_INPUT_METADATA}
          entityId={0}
          onChange={onChange}
        />
      );

      // Then - label should appear once (in row label), not in input
      const ageLabels = screen.getAllByText(/age/i);
      expect(ageLabels).toHaveLength(1);
    });
  });

  describe('remove button', () => {
    test('given onRemove provided then shows remove button', async () => {
      // Given
      const onChange = createMockOnChange();
      const onRemove = createMockOnRemove();

      // When
      render(
        <VariableRow
          variable={MOCK_FLOAT_VARIABLE}
          household={MOCK_INPUT_HOUSEHOLD}
          metadata={MOCK_INPUT_METADATA}
          entityId={0}
          onChange={onChange}
          onRemove={onRemove}
        />
      );

      // Then - button should be present (type="button" from ActionIcon)
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThanOrEqual(1);
    });

    test('given onRemove provided and user clicks remove then calls onRemove', async () => {
      // Given
      const user = userEvent.setup();
      const onChange = createMockOnChange();
      const onRemove = createMockOnRemove();

      render(
        <VariableRow
          variable={MOCK_FLOAT_VARIABLE}
          household={MOCK_INPUT_HOUSEHOLD}
          metadata={MOCK_INPUT_METADATA}
          entityId={0}
          onChange={onChange}
          onRemove={onRemove}
        />
      );

      // When - click the button (ActionIcon with IconX)
      const buttons = screen.getAllByRole('button');
      const removeButton = buttons.find((btn) => btn.querySelector('svg.tabler-icon-x'));
      expect(removeButton).toBeDefined();
      await user.click(removeButton!);

      // Then
      expect(onRemove).toHaveBeenCalledTimes(1);
    });

    test('given onRemove not provided then does not show remove button', () => {
      // Given
      const onChange = createMockOnChange();

      // When
      render(
        <VariableRow
          variable={MOCK_FLOAT_VARIABLE}
          household={MOCK_INPUT_HOUSEHOLD}
          metadata={MOCK_INPUT_METADATA}
          entityId={0}
          onChange={onChange}
        />
      );

      // Then - no button with X icon rendered
      const buttons = screen.queryAllByRole('button');
      const removeButton = buttons.find((btn) => btn.querySelector('svg.tabler-icon-x'));
      expect(removeButton).toBeUndefined();
    });

    test('given showRemoveColumn true but no onRemove then reserves space but no button', () => {
      // Given
      const onChange = createMockOnChange();

      // When
      render(
        <VariableRow
          variable={MOCK_FLOAT_VARIABLE}
          household={MOCK_INPUT_HOUSEHOLD}
          metadata={MOCK_INPUT_METADATA}
          entityId={0}
          onChange={onChange}
          showRemoveColumn
        />
      );

      // Then - no button with X icon rendered
      const buttons = screen.queryAllByRole('button');
      const removeButton = buttons.find((btn) => btn.querySelector('svg.tabler-icon-x'));
      expect(removeButton).toBeUndefined();
    });
  });

  describe('disabled state', () => {
    test('given disabled true then input is disabled', () => {
      // Given
      const onChange = createMockOnChange();

      // When
      render(
        <VariableRow
          variable={MOCK_FLOAT_VARIABLE}
          household={MOCK_INPUT_HOUSEHOLD}
          metadata={MOCK_INPUT_METADATA}
          entityId={0}
          onChange={onChange}
          disabled
        />
      );

      // Then - the input inside should be disabled
      expect(screen.getByRole('textbox')).toBeDisabled();
    });
  });
});

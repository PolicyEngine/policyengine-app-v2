import { render, screen } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import VariableInput from '@/components/household/VariableInput';
import {
  createMockOnChange,
  MOCK_BOOL_VARIABLE,
  MOCK_ENUM_VARIABLE,
  MOCK_FLOAT_VARIABLE,
  MOCK_INPUT_HOUSEHOLD,
  MOCK_INPUT_METADATA,
  MOCK_INT_VARIABLE,
  MOCK_STRING_VARIABLE,
} from '@/tests/fixtures/components/household/variableInputMocks';

describe('VariableInput', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('hideLabel prop', () => {
    test('given hideLabel false then renders label on NumberInput', () => {
      // Given
      const onChange = createMockOnChange();

      // When
      render(
        <VariableInput
          variable={MOCK_FLOAT_VARIABLE}
          household={MOCK_INPUT_HOUSEHOLD}
          metadata={MOCK_INPUT_METADATA}
          entityId={0}
          onChange={onChange}
          hideLabel={false}
        />
      );

      // Then
      expect(screen.getByLabelText(/employment income/i)).toBeInTheDocument();
    });

    test('given hideLabel true then does not render label on NumberInput', () => {
      // Given
      const onChange = createMockOnChange();

      // When
      render(
        <VariableInput
          variable={MOCK_FLOAT_VARIABLE}
          household={MOCK_INPUT_HOUSEHOLD}
          metadata={MOCK_INPUT_METADATA}
          entityId={0}
          onChange={onChange}
          hideLabel
        />
      );

      // Then
      expect(screen.queryByLabelText(/employment income/i)).not.toBeInTheDocument();
      // But input should still exist
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    test('given hideLabel true on Enum then does not render label on Select', () => {
      // Given
      const onChange = createMockOnChange();

      // When
      render(
        <VariableInput
          variable={MOCK_ENUM_VARIABLE}
          household={MOCK_INPUT_HOUSEHOLD}
          metadata={MOCK_INPUT_METADATA}
          onChange={onChange}
          hideLabel
        />
      );

      // Then
      expect(screen.queryByLabelText(/state/i)).not.toBeInTheDocument();
      // Select should still be accessible via combobox role
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    test('given hideLabel not provided then defaults to showing label', () => {
      // Given
      const onChange = createMockOnChange();

      // When
      render(
        <VariableInput
          variable={MOCK_INT_VARIABLE}
          household={MOCK_INPUT_HOUSEHOLD}
          metadata={MOCK_INPUT_METADATA}
          entityId={0}
          onChange={onChange}
        />
      );

      // Then
      expect(screen.getByLabelText(/age/i)).toBeInTheDocument();
    });
  });

  describe('data type rendering', () => {
    test('given float variable then renders NumberInput', () => {
      // Given
      const onChange = createMockOnChange();

      // When
      render(
        <VariableInput
          variable={MOCK_FLOAT_VARIABLE}
          household={MOCK_INPUT_HOUSEHOLD}
          metadata={MOCK_INPUT_METADATA}
          entityId={0}
          onChange={onChange}
        />
      );

      // Then
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
    });

    test('given bool variable then renders Switch with True/False labels', () => {
      // Given
      const onChange = createMockOnChange();

      // When
      render(
        <VariableInput
          variable={MOCK_BOOL_VARIABLE}
          household={MOCK_INPUT_HOUSEHOLD}
          metadata={MOCK_INPUT_METADATA}
          entityId={0}
          onChange={onChange}
        />
      );

      // Then
      expect(screen.getByText('False')).toBeInTheDocument();
      expect(screen.getByText('True')).toBeInTheDocument();
      expect(screen.getByRole('switch')).toBeInTheDocument();
    });

    test('given enum variable with possibleValues then renders Select', () => {
      // Given
      const onChange = createMockOnChange();

      // When
      render(
        <VariableInput
          variable={MOCK_ENUM_VARIABLE}
          household={MOCK_INPUT_HOUSEHOLD}
          metadata={MOCK_INPUT_METADATA}
          onChange={onChange}
        />
      );

      // Then - Select renders as textbox in Mantine
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    test('given string variable then renders TextInput', () => {
      // Given
      const onChange = createMockOnChange();

      // When
      render(
        <VariableInput
          variable={MOCK_STRING_VARIABLE}
          household={MOCK_INPUT_HOUSEHOLD}
          metadata={MOCK_INPUT_METADATA}
          entityId={0}
          onChange={onChange}
        />
      );

      // Then
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });
  });

  describe('disabled state', () => {
    test('given disabled true then input is disabled', () => {
      // Given
      const onChange = createMockOnChange();

      // When
      render(
        <VariableInput
          variable={MOCK_FLOAT_VARIABLE}
          household={MOCK_INPUT_HOUSEHOLD}
          metadata={MOCK_INPUT_METADATA}
          entityId={0}
          onChange={onChange}
          disabled
        />
      );

      // Then
      expect(screen.getByRole('textbox')).toBeDisabled();
    });

    test('given disabled false then input is enabled', () => {
      // Given
      const onChange = createMockOnChange();

      // When
      render(
        <VariableInput
          variable={MOCK_FLOAT_VARIABLE}
          household={MOCK_INPUT_HOUSEHOLD}
          metadata={MOCK_INPUT_METADATA}
          entityId={0}
          onChange={onChange}
          disabled={false}
        />
      );

      // Then
      expect(screen.getByRole('textbox')).not.toBeDisabled();
    });
  });
});

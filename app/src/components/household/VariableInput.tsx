/**
 * VariableInput - Renders the appropriate input control based on variable metadata
 *
 * Dynamically selects NumberInput, Select, Switch, or TextInput based on data_type.
 * Uses VariableResolver for entity-aware value getting/setting.
 */

import { Group, NumberInput, Select, Switch, Text, TextInput } from '@mantine/core';
import { Household } from '@/types/ingredients/Household';
import { getInputFormattingProps } from '@/utils/householdValues';
import { getValue, setValue, VariableInfo } from '@/utils/VariableResolver';

export interface VariableInputProps {
  variable: VariableInfo;
  household: Household;
  metadata: any;
  year: string;
  entityName?: string; // Required for person-level variables
  onChange: (newHousehold: Household) => void;
  disabled?: boolean;
}

export default function VariableInput({
  variable,
  household,
  metadata,
  year,
  entityName,
  onChange,
  disabled = false,
}: VariableInputProps) {
  const currentValue = getValue(household, variable.name, metadata, year, entityName);

  const handleChange = (value: any) => {
    const newHousehold = setValue(household, variable.name, value, metadata, year, entityName);
    onChange(newHousehold);
  };

  // Get formatting props for number inputs
  const formattingProps = getInputFormattingProps({
    data_type: variable.dataType,
  });

  // Render based on data_type (V2 API field)
  switch (variable.dataType) {
    // Note: Same pattern in ValueInputBox.tsx - extract to shared component if reused again
    case 'bool': {
      const isChecked = Boolean(currentValue);
      return (
        <Group gap="xs" justify="flex-start">
          <Text size="sm" c={isChecked ? 'dimmed' : 'dark'} fw={isChecked ? 400 : 600}>
            False
          </Text>
          <Switch
            checked={isChecked}
            onChange={(event) => handleChange(event.currentTarget.checked)}
            disabled={disabled}
          />
          <Text size="sm" c={isChecked ? 'dark' : 'dimmed'} fw={isChecked ? 600 : 400}>
            True
          </Text>
        </Group>
      );
    }

    case 'Enum':
      if (
        variable.possibleValues &&
        Array.isArray(variable.possibleValues) &&
        variable.possibleValues.length > 0
      ) {
        return (
          <Select
            label={variable.label}
            value={currentValue?.toString() || ''}
            onChange={(val) => handleChange(val)}
            data={variable.possibleValues.map((pv: string) => ({
              value: pv,
              label: pv,
            }))}
            placeholder={`Select ${variable.label}`}
            searchable
            disabled={disabled}
          />
        );
      }
      // Fall through to text input if no possibleValues
      return (
        <TextInput
          label={variable.label}
          value={currentValue?.toString() || ''}
          onChange={(e) => handleChange(e.currentTarget.value)}
          placeholder={`Enter ${variable.label}`}
          disabled={disabled}
        />
      );

    case 'float':
    case 'int':
      return (
        <NumberInput
          label={variable.label}
          value={currentValue ?? variable.defaultValue ?? 0}
          onChange={(val) => handleChange(val)}
          placeholder={`Enter ${variable.label}`}
          disabled={disabled}
          {...formattingProps}
        />
      );

    case 'str':
    default:
      return (
        <TextInput
          label={variable.label}
          value={currentValue?.toString() || ''}
          onChange={(e) => handleChange(e.currentTarget.value)}
          placeholder={`Enter ${variable.label}`}
          disabled={disabled}
        />
      );
  }
}

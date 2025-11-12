import { Group, NumberInput, Stack, Switch, Text } from '@mantine/core';
import { getCurrencySymbolFromUnit, isBooleanUnit, isPercentageUnit } from '@/utils/formatters';
import { ValueInputBoxProps } from './types';

export function ValueInputBox(props: ValueInputBoxProps) {
  const { param, value, onChange, label } = props;

  const prefix = getCurrencySymbolFromUnit(param.unit);
  const isPercentage = isPercentageUnit(param.unit);
  const isBool = isBooleanUnit(param.unit);

  if (param.type !== 'parameter') {
    console.error("ValueInputBox expects a parameter type of 'parameter', got:", param.type);
    return <NumberInput disabled value={0} />;
  }

  const handleChange = (newValue: any) => {
    if (onChange) {
      // Convert percentage display value (0-100) to decimal (0-1) for storage
      const valueToStore = isPercentage ? newValue / 100 : newValue;
      onChange(valueToStore);
    }
  };

  const handleBoolChange = (checked: boolean) => {
    if (onChange) {
      onChange(checked);
    }
  };

  // Convert decimal value (0-1) to percentage display value (0-100)
  // Defensive: ensure value is a number, not an object/array/string
  const numericValue = typeof value === 'number' ? value : 0;
  const displayValue = isPercentage ? numericValue * 100 : numericValue;

  if (isBool) {
    return (
      <Stack gap="xs" style={{ flex: 1 }}>
        {label && (
          <Text size="sm" fw={500}>
            {label}
          </Text>
        )}
        <Group
          justify="space-between"
          align="center"
          style={{
            border: '1px solid #ced4da',
            borderRadius: '4px',
            padding: '6px 12px',
            height: '36px',
            backgroundColor: 'white',
          }}
        >
          <Text size="sm" c={value ? 'dimmed' : 'dark'} fw={value ? 400 : 600}>
            False
          </Text>
          <Switch
            checked={value || false}
            onChange={(event) => handleBoolChange(event.currentTarget.checked)}
            size="md"
          />
          <Text size="sm" c={value ? 'dark' : 'dimmed'} fw={value ? 600 : 400}>
            True
          </Text>
        </Group>
      </Stack>
    );
  }

  return (
    <NumberInput
      label={label}
      placeholder="Enter value"
      min={0}
      prefix={prefix}
      suffix={isPercentage ? '%' : ''}
      value={displayValue}
      onChange={handleChange}
      thousandSeparator=","
      style={{ flex: 1 }}
    />
  );
}

/**
 * VariableInput - Renders the appropriate input control based on variable metadata
 *
 * Dynamically selects NumberInput, Select, Switch, or TextInput based on valueType.
 * Uses VariableResolver for entity-aware value getting/setting.
 */

import { useEffect, useState } from 'react';
import {
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Text,
} from '@/components/ui';
import { colors, typography } from '@/designTokens';
import { Household } from '@/types/ingredients/Household';
import { getInputFormattingProps } from '@/utils/householdValues';
import { coerceByValueType } from '@/utils/valueCoercion';
import { getNormalizedVariableMetadata } from '@/utils/variableMetadata';
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
  const resolvedVariable = {
    ...variable,
    ...getNormalizedVariableMetadata(metadata?.variables?.[variable.name]),
    label:
      variable.label !== undefined
        ? variable.label
        : metadata?.variables?.[variable.name]?.label || '',
  };
  const currentValue = getValue(household, resolvedVariable.name, metadata, year, entityName);
  const numericFormatting = getInputFormattingProps(resolvedVariable);
  const isPercentage = resolvedVariable.unit === '/1';
  const rawNumericValue =
    typeof currentValue === 'number'
      ? currentValue
      : typeof resolvedVariable.defaultValue === 'number'
        ? resolvedVariable.defaultValue
        : 0;
  const textValue = currentValue?.toString() || '';
  const editableNumericValue = isPercentage ? rawNumericValue * 100 : rawNumericValue;
  const [isEditingNumericValue, setIsEditingNumericValue] = useState(false);
  const [numericInputValue, setNumericInputValue] = useState('');
  const [isEditingTextValue, setIsEditingTextValue] = useState(false);
  const [textInputValue, setTextInputValue] = useState(textValue);

  const handleChange = (value: any) => {
    const newHousehold = setValue(household, variable.name, value, metadata, year, entityName);
    onChange(newHousehold);
  };

  useEffect(() => {
    if (resolvedVariable.valueType !== 'float' && resolvedVariable.valueType !== 'int') {
      return;
    }

    if (!isEditingNumericValue) {
      setNumericInputValue(formatNumericDisplay(editableNumericValue, numericFormatting));
    }
  }, [editableNumericValue, isEditingNumericValue, numericFormatting, resolvedVariable.valueType]);

  useEffect(() => {
    if (resolvedVariable.valueType === 'float' || resolvedVariable.valueType === 'int') {
      return;
    }

    if (!isEditingTextValue) {
      setTextInputValue(textValue);
    }
  }, [isEditingTextValue, resolvedVariable.valueType, textValue]);

  const handleNumericInputChange = (nextValue: string) => {
    setNumericInputValue(nextValue);
  };

  const commitNumericInputValue = () => {
    const parsedValue = parseNumericInput(numericInputValue);
    if (parsedValue === null) {
      setIsEditingNumericValue(false);
      setNumericInputValue(formatNumericDisplay(editableNumericValue, numericFormatting));
      return;
    }

    const normalizedValue = isPercentage ? parsedValue / 100 : parsedValue;
    const coercedValue = coerceByValueType(normalizedValue, resolvedVariable.valueType);

    setIsEditingNumericValue(false);
    setNumericInputValue(formatNumericDisplay(parsedValue, numericFormatting));

    if (coercedValue === rawNumericValue) {
      return;
    }

    handleChange(coercedValue);
  };

  const commitTextInputValue = () => {
    setIsEditingTextValue(false);

    if (textInputValue === textValue) {
      return;
    }

    handleChange(textInputValue);
  };

  // Render based on valueType
  switch (resolvedVariable.valueType) {
    // Note: Same pattern in ValueInputBox.tsx - extract to shared component if reused again
    case 'bool': {
      const isChecked = Boolean(currentValue);
      return (
        <div className="tw:flex tw:items-center tw:gap-1 tw:justify-start">
          <Text
            size="sm"
            style={{
              color: isChecked ? colors.gray[600] : colors.gray[900],
              fontWeight: isChecked ? typography.fontWeight.normal : typography.fontWeight.semibold,
            }}
          >
            False
          </Text>
          <Switch
            checked={isChecked}
            onCheckedChange={(checked) => handleChange(checked)}
            disabled={disabled}
          />
          <Text
            size="sm"
            style={{
              color: isChecked ? colors.gray[900] : colors.gray[600],
              fontWeight: isChecked ? typography.fontWeight.semibold : typography.fontWeight.normal,
            }}
          >
            True
          </Text>
        </div>
      );
    }

    case 'Enum':
      if (resolvedVariable.possibleValues && resolvedVariable.possibleValues.length > 0) {
        return (
          <div>
            <Select
              value={currentValue?.toString() || ''}
              onValueChange={(val) => handleChange(val)}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder={`Select ${resolvedVariable.label}`} />
              </SelectTrigger>
              <SelectContent>
                {resolvedVariable.possibleValues.map((pv: { value: string; label: string }) => (
                  <SelectItem key={pv.value} value={pv.value}>
                    {pv.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      }
      // Fall through to text input if no possibleValues
      return (
        <div>
          <Input
            value={currentValue?.toString() || ''}
            onChange={(e) => handleChange(e.currentTarget.value)}
            placeholder={`Enter ${resolvedVariable.label}`}
            disabled={disabled}
          />
        </div>
      );

    case 'float':
    case 'int':
      return (
        <div>
          <div className="tw:relative">
            {numericFormatting.prefix && (
              <span
                className="tw:absolute tw:left-3 tw:top-1/2 tw:-translate-y-1/2 tw:text-sm tw:text-gray-500"
                aria-hidden="true"
              >
                {numericFormatting.prefix}
              </span>
            )}
            <Input
              type="text"
              inputMode={resolvedVariable.valueType === 'int' ? 'numeric' : 'decimal'}
              value={numericInputValue}
              onFocus={() => {
                setIsEditingNumericValue(true);
                setNumericInputValue(toEditableNumericString(editableNumericValue));
              }}
              onBlur={commitNumericInputValue}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  e.currentTarget.blur();
                }
              }}
              onChange={(e) => handleNumericInputChange(e.currentTarget.value)}
              placeholder={`Enter ${resolvedVariable.label}`}
              disabled={disabled}
              className={[
                numericFormatting.prefix ? 'tw:pl-8' : '',
                numericFormatting.suffix ? 'tw:pr-10' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            />
            {numericFormatting.suffix && (
              <span
                className="tw:absolute tw:right-3 tw:top-1/2 tw:-translate-y-1/2 tw:text-sm tw:text-gray-500"
                aria-hidden="true"
              >
                {numericFormatting.suffix}
              </span>
            )}
          </div>
        </div>
      );

    case 'str':
    default:
      return (
        <div>
          <Input
            value={textInputValue}
            onFocus={() => setIsEditingTextValue(true)}
            onBlur={commitTextInputValue}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                e.currentTarget.blur();
              }
            }}
            onChange={(e) => setTextInputValue(e.currentTarget.value)}
            placeholder={`Enter ${resolvedVariable.label}`}
            disabled={disabled}
          />
        </div>
      );
  }
}

function parseNumericInput(value: string): number | null {
  const cleanedValue = value.replace(/,/g, '').trim();

  if (!cleanedValue || cleanedValue === '-' || cleanedValue === '.' || cleanedValue === '-.') {
    return null;
  }

  const parsedValue = Number(cleanedValue);
  return Number.isNaN(parsedValue) ? null : parsedValue;
}

function toEditableNumericString(value: number): string {
  if (!Number.isFinite(value)) {
    return '0';
  }

  return value.toString();
}

function formatNumericDisplay(
  value: number,
  formatting: ReturnType<typeof getInputFormattingProps>
): string {
  if (!Number.isFinite(value)) {
    return '0';
  }

  return new Intl.NumberFormat(undefined, {
    useGrouping: true,
    minimumFractionDigits: formatting.decimalScale ?? 0,
    maximumFractionDigits: formatting.decimalScale ?? 2,
  }).format(value);
}

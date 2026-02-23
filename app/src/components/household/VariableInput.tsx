/**
 * VariableInput - Renders the appropriate input control based on variable metadata
 *
 * Dynamically selects NumberInput, Select, Switch, or TextInput based on valueType.
 * Uses VariableResolver for entity-aware value getting/setting.
 */

import {
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Text,
} from '@/components/ui';
import { Household } from '@/types/ingredients/Household';
import { getInputFormattingProps } from '@/utils/householdValues';
import { coerceByValueType } from '@/utils/valueCoercion';
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
    valueType: variable.valueType,
    unit: variable.unit,
  });

  // Render based on valueType
  switch (variable.valueType) {
    // Note: Same pattern in ValueInputBox.tsx - extract to shared component if reused again
    case 'bool': {
      const isChecked = Boolean(currentValue);
      return (
        <div className="tw:flex tw:items-center tw:gap-1 tw:justify-start">
          <Text
            size="sm"
            style={{ color: isChecked ? '#868e96' : '#212529', fontWeight: isChecked ? 400 : 600 }}
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
            style={{ color: isChecked ? '#212529' : '#868e96', fontWeight: isChecked ? 600 : 400 }}
          >
            True
          </Text>
        </div>
      );
    }

    case 'Enum':
      if (variable.possibleValues && variable.possibleValues.length > 0) {
        return (
          <div>
            {variable.label && <Label>{variable.label}</Label>}
            <Select
              value={currentValue?.toString() || ''}
              onValueChange={(val) => handleChange(val)}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder={`Select ${variable.label}`} />
              </SelectTrigger>
              <SelectContent>
                {variable.possibleValues.map((pv) => (
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
          {variable.label && <Label>{variable.label}</Label>}
          <Input
            value={currentValue?.toString() || ''}
            onChange={(e) => handleChange(e.currentTarget.value)}
            placeholder={`Enter ${variable.label}`}
            disabled={disabled}
          />
        </div>
      );

    case 'float':
    case 'int':
      return (
        <div>
          {variable.label && <Label>{variable.label}</Label>}
          <Input
            type="number"
            value={currentValue ?? variable.defaultValue ?? 0}
            onChange={(e) =>
              handleChange(coerceByValueType(e.target.valueAsNumber || 0, variable.valueType))
            }
            placeholder={`Enter ${variable.label}`}
            disabled={disabled}
            step={variable.valueType === 'int' ? 1 : 'any'}
          />
        </div>
      );

    case 'str':
    default:
      return (
        <div>
          {variable.label && <Label>{variable.label}</Label>}
          <Input
            value={currentValue?.toString() || ''}
            onChange={(e) => handleChange(e.currentTarget.value)}
            placeholder={`Enter ${variable.label}`}
            disabled={disabled}
          />
        </div>
      );
  }
}

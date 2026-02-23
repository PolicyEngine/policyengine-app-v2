import { Input, Switch } from '@/components/ui';
import { spacing } from '@/designTokens';
import { ParameterMetadata } from '@/types/metadata/parameterMetadata';
import { coerceByUnit } from '@/utils/valueCoercion';

interface ValueInputBoxProps {
  label?: string;
  param: ParameterMetadata;
  value?: any;
  onChange?: (value: any) => void;
}

export function ValueInputBox(props: ValueInputBoxProps) {
  const { param, value, onChange, label } = props;

  // US and UK packages use these type designations inconsistently
  const USD_UNITS = ['currency-USD', 'currency_USD', 'USD'];
  const GBP_UNITS = ['currency-GBP', 'currency_GBP', 'GBP'];

  const prefix = USD_UNITS.includes(String(param.unit))
    ? '$'
    : GBP_UNITS.includes(String(param.unit))
      ? '£'
      : '';

  const isPercentage = param.unit === '/1';
  const isBool = param.unit === 'bool';

  if (param.type !== 'parameter') {
    console.error("ValueInputBox expects a parameter type of 'parameter', got:", param.type);
    return <Input type="number" disabled value={0} />;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      const newValue = e.target.value === '' ? 0 : parseFloat(e.target.value);
      // Coerce to proper type
      const coerced = coerceByUnit(newValue, param.unit);
      // Convert percentage display value (0-100) to decimal (0-1) for storage
      const valueToStore = isPercentage ? (coerced as number) / 100 : coerced;
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
      <div className="tw:flex tw:flex-col tw:gap-xs tw:flex-1">
        {label && (
          <label className="tw:text-sm tw:font-medium">
            {label}
          </label>
        )}
        <div
          className="tw:flex tw:justify-between tw:items-center"
          style={{
            border: '1px solid #ced4da',
            borderRadius: spacing.radius.element,
            padding: '6px 12px',
            height: '36px',
            backgroundColor: 'white',
          }}
        >
          <span className={`tw:text-sm ${value ? 'tw:text-gray-400' : 'tw:text-gray-900 tw:font-semibold'}`}>
            False
          </span>
          <Switch
            checked={value || false}
            onCheckedChange={handleBoolChange}
          />
          <span className={`tw:text-sm ${value ? 'tw:text-gray-900 tw:font-semibold' : 'tw:text-gray-400'}`}>
            True
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="tw:flex tw:flex-col tw:gap-xs tw:flex-1">
      {label && (
        <label className="tw:text-sm tw:font-medium">
          {label}
        </label>
      )}
      <div className="tw:relative tw:flex tw:items-center">
        {prefix && (
          <span className="tw:absolute tw:left-3 tw:text-sm tw:text-gray-500">{prefix}</span>
        )}
        <Input
          type="number"
          placeholder="Enter value"
          min={0}
          value={displayValue}
          onChange={handleChange}
          className={prefix ? 'tw:pl-7' : ''}
          style={{ flex: 1 }}
        />
        {isPercentage && (
          <span className="tw:absolute tw:right-3 tw:text-sm tw:text-gray-500">%</span>
        )}
      </div>
    </div>
  );
}

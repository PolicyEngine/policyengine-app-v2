import { useState } from 'react';
import { Input } from '@/components/ui';
import { cn } from '@/lib/utils';
import { ValueInputBox } from '@/pathways/report/components/valueSetters/ValueInputBox';
import { ParameterMetadata } from '@/types/metadata/parameterMetadata';
import { coerceByUnit } from '@/utils/valueCoercion';

interface ValueInputProps {
  param: ParameterMetadata;
  value: any;
  onChange: (value: any) => void;
}

const CURRENCY_PREFIXES: Record<string, string> = {
  'currency-USD': '$',
  currency_USD: '$',
  USD: '$',
  'currency-GBP': '£',
  currency_GBP: '£',
  GBP: '£',
};

/** A stored value as the box shows it: rates as percentages, without float noise. */
function displayText(value: unknown, percentage: boolean): string {
  if (typeof value !== 'number') {
    return '';
  }
  return String(Number((percentage ? value * 100 : value).toPrecision(12)));
}

/**
 * A number box for a reform value. It looks like the policy editor's
 * box, but the field can be emptied while typing — the editor's box
 * refuses an empty field, so the last digit can't be deleted — and an
 * empty field left behind means 0. Yes/no values keep the editor's switch.
 */
export default function ValueInput({ param, value, onChange }: ValueInputProps) {
  if (param.unit === 'bool') {
    return <ValueInputBox param={param} value={value} onChange={onChange} />;
  }
  return <NumberInput param={param} value={value} onChange={onChange} />;
}

function NumberInput({ param, value, onChange }: ValueInputProps) {
  const percentage = param.unit === '/1';
  const prefix = CURRENCY_PREFIXES[String(param.unit)] ?? '';
  // While focused, the box shows what is typed, even an empty field;
  // otherwise, the value it stands for.
  const [typed, setTyped] = useState<string | null>(null);

  const commit = (text: string) => {
    const number = coerceByUnit(text, param.unit) as number;
    onChange(percentage ? number / 100 : number);
  };

  return (
    <div className="tw:relative tw:flex tw:flex-1 tw:items-center">
      {prefix && (
        <span className="tw:pointer-events-none tw:absolute tw:left-3 tw:text-sm tw:text-gray-500">
          {prefix}
        </span>
      )}
      <Input
        type="number"
        min={0}
        value={typed ?? displayText(value, percentage)}
        onFocus={() => setTyped(displayText(value, percentage))}
        onChange={(event) => {
          const text = event.target.value;
          // Only a focused box holds typed text; a change from elsewhere commits as is.
          if (typed !== null) {
            setTyped(text);
          }
          // An empty field waits for the next digit, or for leaving.
          if (text !== '') {
            commit(text);
          }
        }}
        onBlur={(event) => {
          // "1." or "-" reads as empty to a number box but is not.
          if (event.target.value === '' && !event.target.validity.badInput) {
            commit('0');
          }
          setTyped(null);
        }}
        className={cn(prefix && 'tw:pl-7', percentage && 'tw:pr-7')}
        style={{ flex: 1 }}
      />
      {percentage && (
        <span className="tw:pointer-events-none tw:absolute tw:right-3 tw:text-sm tw:text-gray-500">
          %
        </span>
      )}
    </div>
  );
}

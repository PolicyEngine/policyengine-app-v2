import { useEffect, useRef, useState } from 'react';
import { IconCheck } from '@tabler/icons-react';
import { Input } from '@/components/ui';
import { colors } from '@/designTokens';
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
 * empty field left behind means 0. Finishing an edit (leaving the box,
 * or Enter) shows a check that the new value is kept. Yes/no values keep
 * the editor's switch.
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
  // The value when editing began, so finishing can tell whether it changed.
  const startValue = useRef<unknown>(null);
  const [saved, setSaved] = useState(false);
  const savedTimer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(savedTimer.current), []);

  const commit = (text: string) => {
    const number = coerceByUnit(text, param.unit) as number;
    const next = percentage ? number / 100 : number;
    onChange(next);
    return next;
  };

  const confirmSaved = () => {
    setSaved(true);
    window.clearTimeout(savedTimer.current);
    savedTimer.current = window.setTimeout(() => setSaved(false), 1600);
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
        onFocus={() => {
          startValue.current = value;
          setSaved(false);
          setTyped(displayText(value, percentage));
        }}
        onKeyDown={(event) => {
          // Enter finishes the edit, as leaving the box does.
          if (event.key === 'Enter') {
            event.currentTarget.blur();
          }
        }}
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
          let final = value;
          // "1." or "-" reads as empty to a number box but is not.
          if (event.target.value === '' && !event.target.validity.badInput) {
            final = commit('0');
          }
          if (
            typeof final === 'number' &&
            !(
              typeof startValue.current === 'number' && Math.abs(final - startValue.current) < 1e-12
            )
          ) {
            confirmSaved();
          }
          setTyped(null);
        }}
        className={cn(
          prefix && 'tw:pl-7',
          // Room on the right for the % sign, the check, or both.
          percentage && saved ? 'tw:pr-12' : (percentage || saved) && 'tw:pr-7'
        )}
        style={{
          flex: 1,
          // The ring flashes as the check appears, then settles.
          boxShadow: saved ? `0 0 0 2px ${colors.primary[300]}` : undefined,
          transition: 'box-shadow 300ms ease',
        }}
      />
      <span
        aria-hidden
        className="tw:pointer-events-none tw:absolute"
        style={{
          right: percentage ? 28 : 10,
          display: 'inline-flex',
          color: colors.primary[600],
          opacity: saved ? 1 : 0,
          transform: saved ? 'scale(1)' : 'scale(0.6)',
          transition: 'opacity 200ms ease, transform 200ms ease',
        }}
      >
        <IconCheck size={14} stroke={2.5} />
      </span>
      <span role="status" className="tw:sr-only">
        {saved ? 'Saved' : ''}
      </span>
      {percentage && (
        <span className="tw:pointer-events-none tw:absolute tw:right-3 tw:text-sm tw:text-gray-500">
          %
        </span>
      )}
    </div>
  );
}

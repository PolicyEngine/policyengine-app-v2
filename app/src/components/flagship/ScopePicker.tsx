import { useState } from 'react';
import { IconCheck, IconChevronDown, IconMapPin } from '@tabler/icons-react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';

export interface ScopeOption {
  code: string;
  label: string;
}

interface ScopePickerProps {
  /** 'all', 'federal', or a lowercase state code */
  value: string;
  onChange: (value: string) => void;
  states: ScopeOption[];
  /** Trigger styling shared with the neighboring filter controls */
  triggerStyle: React.CSSProperties;
  /** How many items each option holds, keyed by option code, e.g. bills per state */
  counts?: Record<string, number>;
  /** The trigger's accessible name before its value, e.g. "State scope" */
  label?: string;
}

const JURISDICTIONS: ScopeOption[] = [
  { code: 'all', label: 'All jurisdictions' },
  { code: 'federal', label: 'Federal only' },
];

/**
 * Word-start matching rather than cmdk's fuzzy default, which finds a
 * "u" and a "t" in "All jurisdictions" and puts it above Utah. A state's
 * code matches exactly: "ut" is Utah, not Kentucky.
 */
export function scopeFilter(value: string, search: string, keywords?: string[]): number {
  const query = search.trim().toLowerCase();
  if (!query) {
    return 1;
  }
  if (keywords?.some((keyword) => keyword.toLowerCase() === query)) {
    return 1;
  }
  const label = value.toLowerCase();
  if (label.startsWith(query)) {
    return 0.9;
  }
  return label.split(/\s+/).some((word) => word.startsWith(query)) ? 0.8 : 0;
}

/**
 * The search scope as a filterable list: fifty-odd states are too many to
 * scan in a native select, so typing narrows them by name or code.
 */
export default function ScopePicker({
  value,
  onChange,
  states,
  triggerStyle,
  counts,
  label = 'State scope',
}: ScopePickerProps) {
  const [open, setOpen] = useState(false);
  const current =
    JURISDICTIONS.find((option) => option.code === value) ??
    states.find((option) => option.code === value);
  const currentLabel = current?.label ?? value.toUpperCase();

  const choose = (code: string) => {
    onChange(code);
    setOpen(false);
  };

  const renderItem = (option: ScopeOption, showCode: boolean) => (
    <CommandItem
      key={option.code}
      // Filtered on label and code, so "ca" and "calif" both find California.
      value={option.label}
      keywords={showCode ? [option.code] : undefined}
      onSelect={() => choose(option.code)}
      style={{ justifyContent: 'space-between', cursor: 'pointer' }}
    >
      <span>{option.label}</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
        {counts?.[option.code] !== undefined && (
          <span
            style={{
              minWidth: 18,
              textAlign: 'right',
              fontSize: typography.fontSize.xs,
              color: colors.text.secondary,
            }}
          >
            {counts[option.code]}
          </span>
        )}
        {showCode && (
          <span
            style={{
              fontFamily: typography.fontFamily.mono,
              fontSize: typography.fontSize.xs,
              color: colors.text.tertiary,
            }}
          >
            {option.code.toUpperCase()}
          </span>
        )}
        <IconCheck
          size={14}
          aria-hidden
          style={{
            color: colors.primary[600],
            visibility: option.code === value ? 'visible' : 'hidden',
          }}
        />
      </span>
    </CommandItem>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`${label}: ${currentLabel}`}
          className="tw:hover:border-border-medium"
          style={{ ...triggerStyle, cursor: 'pointer' }}
        >
          <IconMapPin size={13} aria-hidden />
          <span style={{ color: colors.text.primary, whiteSpace: 'nowrap' }}>{currentLabel}</span>
          <IconChevronDown
            size={12}
            aria-hidden
            style={{
              transform: open ? 'rotate(180deg)' : undefined,
              transition: 'transform 160ms ease',
            }}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" style={{ width: 260, padding: 0 }}>
        <Command filter={scopeFilter} label="Find a state">
          <CommandInput placeholder="Find a state…" />
          <CommandList>
            <CommandEmpty>No matching state</CommandEmpty>
            <CommandGroup>{JURISDICTIONS.map((option) => renderItem(option, false))}</CommandGroup>
            {states.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="States">
                  {states.map((option) => renderItem(option, true))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

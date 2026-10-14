import { useState } from 'react';
import { IconCheck, IconChevronDown, IconUsers } from '@tabler/icons-react';
import { STATE_NAMES } from '@/api/billFeed';
import { scopeFilter } from '@/components/flagship/ScopePicker';
import {
  Badge,
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

/** A region as the model's metadata lists it: "state/ca", "California". */
export interface PopulationRegion {
  name: string;
  label: string;
}

interface PopulationPickerProps {
  /** The chosen region's name; empty for the whole country. */
  value: string;
  onChange: (region: string | undefined) => void;
  /** The country's regions, from metadata (economy_options.region). */
  regions: PopulationRegion[];
}

const STATE_PREFIX = 'state/';
const DISTRICT_PREFIX = 'congressional_district/';

/** "California's 1st congressional district" reads "California's 1st" beside its code. */
const shortDistrictLabel = (label: string) => label.replace(/\s+congressional district$/i, '');

/**
 * What the trigger shows for a region: "Nationwide", "California",
 * "California's 1st". Before metadata lists the regions — while it loads —
 * a state still reads by name and a district by its code, never as
 * "state/ar".
 */
export function populationLabel(value: string, regions: PopulationRegion[]): string {
  if (!value) {
    return 'Nationwide';
  }
  const region = regions.find((candidate) => candidate.name === value);
  if (region) {
    return value.startsWith(DISTRICT_PREFIX) ? shortDistrictLabel(region.label) : region.label;
  }
  if (value.startsWith(STATE_PREFIX)) {
    const code = value.slice(STATE_PREFIX.length).toUpperCase();
    return STATE_NAMES[code] ?? code;
  }
  return value.startsWith(DISTRICT_PREFIX) ? value.slice(DISTRICT_PREFIX.length) : value;
}

/**
 * Who a reform runs on: the whole country, one state, or one
 * congressional district. Fifty-one states and 436 districts are too many
 * to scan, so typing narrows them by name or code ("ca", "CA-01");
 * districts list only once something is typed. A household is coming.
 */
export default function PopulationPicker({ value, onChange, regions }: PopulationPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const states = regions.filter((region) => region.name.startsWith(STATE_PREFIX));
  const districts = regions.filter((region) => region.name.startsWith(DISTRICT_PREFIX));
  const currentLabel = populationLabel(value, regions);

  const choose = (region: string | undefined) => {
    onChange(region);
    setOpen(false);
    setSearch('');
  };

  const check = (selected: boolean) => (
    <IconCheck
      size={14}
      aria-hidden
      style={{ color: colors.primary[600], visibility: selected ? 'visible' : 'hidden' }}
    />
  );

  const code = (text: string) => (
    <span
      style={{
        fontFamily: typography.fontFamily.mono,
        fontSize: typography.fontSize.xs,
        color: colors.text.tertiary,
      }}
    >
      {text}
    </span>
  );

  const regionItem = (region: PopulationRegion, label: string, regionCode: string) => (
    <CommandItem
      key={region.name}
      value={label}
      keywords={[regionCode]}
      onSelect={() => choose(region.name)}
      style={{ justifyContent: 'space-between', cursor: 'pointer' }}
    >
      <span>{label}</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
        {code(regionCode)}
        {check(region.name === value)}
      </span>
    </CommandItem>
  );

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setSearch('');
        }
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Population: ${currentLabel}`}
          className="tw:inline-flex tw:h-9 tw:cursor-pointer tw:items-center tw:rounded-md tw:border tw:border-input tw:bg-white tw:px-3 tw:text-sm tw:whitespace-nowrap tw:shadow-xs tw:transition-colors tw:hover:border-primary-500"
          style={{ gap: spacing.sm, fontFamily: typography.fontFamily.primary }}
        >
          <span aria-hidden style={{ display: 'inline-flex', color: colors.text.tertiary }}>
            <IconUsers size={16} />
          </span>
          {/* On a phone the icon says it; the choice keeps the room. */}
          <span
            className="tw:hidden tw:sm:inline"
            style={{ fontSize: typography.fontSize.xs, color: colors.text.tertiary }}
          >
            Population
          </span>
          <span style={{ fontWeight: typography.fontWeight.medium, color: colors.text.primary }}>
            {currentLabel}
          </span>
          <IconChevronDown
            size={14}
            aria-hidden
            style={{
              color: colors.text.tertiary,
              transform: open ? 'rotate(180deg)' : undefined,
              transition: 'transform 160ms ease',
            }}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        // On a phone each choice is a fingertip tall.
        className="tw:max-sm:[&_[data-slot=command-item]]:min-h-10"
        style={{ width: 300, padding: 0 }}
      >
        <Command filter={scopeFilter} label="Find a state or district">
          <CommandInput
            // 16px on a phone, so the browser does not zoom in to type.
            className="tw:max-sm:text-base"
            placeholder="Find a state or district…"
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>No matching state or district</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="Nationwide"
                onSelect={() => choose(undefined)}
                style={{ justifyContent: 'space-between', cursor: 'pointer' }}
              >
                <span>Nationwide</span>
                {check(!value)}
              </CommandItem>
              <CommandItem value="A household" disabled style={{ justifyContent: 'space-between' }}>
                <span>A household</span>
                <Badge variant="secondary">Soon</Badge>
              </CommandItem>
            </CommandGroup>
            {states.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="States">
                  {states.map((region) =>
                    regionItem(
                      region,
                      region.label,
                      region.name.slice(STATE_PREFIX.length).toUpperCase()
                    )
                  )}
                </CommandGroup>
              </>
            )}
            {/* 436 districts would swamp the list; they join it once something is typed. */}
            {search.trim() && districts.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Congressional districts">
                  {districts.map((region) =>
                    regionItem(
                      region,
                      shortDistrictLabel(region.label),
                      region.name.slice(DISTRICT_PREFIX.length)
                    )
                  )}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

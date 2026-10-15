import { Fragment, useState } from 'react';
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
const UK_COUNTRY_PREFIX = 'country/';

/** "California's 1st congressional district" reads "California's 1st" beside its code. */
const shortDistrictLabel = (label: string) => label.replace(/\s+congressional district$/i, '');

/** The UK's nations, by the name metadata gives them, for before it loads. */
const UK_COUNTRY_NAMES: Record<string, string> = {
  england: 'England',
  scotland: 'Scotland',
  wales: 'Wales',
  ni: 'Northern Ireland',
};

/**
 * A kind of region the model's metadata lists, as the picker shows it.
 * Listed kinds show from the start; the others are too many to scan and
 * join the list once something is typed.
 */
interface RegionKind {
  prefix: string;
  heading: string;
  /** What one is called, for the search's prompt. */
  noun: string;
  listed: boolean;
  /** The code beside a region's name, which also finds it: "CA", "CA-01". */
  code?: (rest: string) => string;
  /** The name as the list shows it. */
  itemLabel?: (label: string) => string;
  /**
   * What a region of this kind is, after its name where the name alone is
   * not enough: a constituency and a local authority can share one.
   */
  kindName?: string;
}

/** Every kind the countries list, in the order the picker shows them. */
const REGION_KINDS: RegionKind[] = [
  {
    prefix: STATE_PREFIX,
    heading: 'States',
    noun: 'state',
    listed: true,
    code: (rest) => rest.toUpperCase(),
  },
  {
    prefix: DISTRICT_PREFIX,
    heading: 'Congressional districts',
    noun: 'district',
    listed: false,
    code: (rest) => rest,
    itemLabel: shortDistrictLabel,
  },
  { prefix: UK_COUNTRY_PREFIX, heading: 'Countries', noun: 'country', listed: true },
  {
    prefix: 'constituency/',
    heading: 'Constituencies',
    noun: 'constituency',
    listed: false,
    kindName: 'constituency',
  },
  {
    prefix: 'local_authority/',
    heading: 'Local authorities',
    noun: 'local authority',
    listed: false,
    kindName: 'local authority',
  },
];

const kindOf = (name: string) => REGION_KINDS.find((kind) => name.startsWith(kind.prefix));

/**
 * "state or district", "country, constituency or local authority"; just
 * "region" before metadata lists any.
 */
function nounList(nouns: string[]): string {
  if (nouns.length <= 1) {
    return nouns[0] ?? 'region';
  }
  return `${nouns.slice(0, -1).join(', ')} or ${nouns[nouns.length - 1]}`;
}

/**
 * What the trigger shows for a region: "Nationwide", "California",
 * "California's 1st", "England", "Bedford (constituency)". Before
 * metadata lists the regions — while it loads — a region still reads by
 * name (a district by its code), never as "state/ar".
 */
export function populationLabel(value: string, regions: PopulationRegion[]): string {
  if (!value) {
    return 'Nationwide';
  }
  const kind = kindOf(value);
  const region = regions.find((candidate) => candidate.name === value);
  const rest = kind ? value.slice(kind.prefix.length) : value;
  const name = region
    ? (kind?.itemLabel?.(region.label) ?? region.label)
    : value.startsWith(STATE_PREFIX)
      ? (STATE_NAMES[rest.toUpperCase()] ?? rest.toUpperCase())
      : value.startsWith(UK_COUNTRY_PREFIX)
        ? (UK_COUNTRY_NAMES[rest] ?? rest)
        : rest;
  return kind?.kindName ? `${name} (${kind.kindName})` : name;
}

/**
 * Who a reform runs on: the whole country or one part of it — a state or
 * congressional district in the US; a nation, constituency or local
 * authority in the UK. The smaller places are too many to scan (436
 * districts, 650 constituencies), so typing narrows them by name or code
 * ("ca", "CA-01") and they list only once something is typed. A
 * household is coming.
 */
export default function PopulationPicker({ value, onChange, regions }: PopulationPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const kinds = REGION_KINDS.map((kind) => ({
    kind,
    members: regions.filter((region) => region.name.startsWith(kind.prefix)),
  })).filter(({ members }) => members.length > 0);
  const nouns = nounList(kinds.map(({ kind }) => kind.noun));
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

  const regionItem = (region: PopulationRegion, kind: RegionKind) => {
    const label = kind.itemLabel?.(region.label) ?? region.label;
    const regionCode = kind.code?.(region.name.slice(kind.prefix.length));
    return (
      <CommandItem
        key={region.name}
        // Unique within the list, where a constituency and a local
        // authority can share a name.
        value={kind.kindName ? `${label} ${kind.kindName}` : label}
        keywords={regionCode ? [regionCode] : undefined}
        onSelect={() => choose(region.name)}
        style={{ justifyContent: 'space-between', cursor: 'pointer' }}
      >
        <span>{label}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
          {regionCode && code(regionCode)}
          {check(region.name === value)}
        </span>
      </CommandItem>
    );
  };

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
        <Command filter={scopeFilter} label={`Find a ${nouns}`}>
          <CommandInput
            // 16px on a phone, so the browser does not zoom in to type.
            className="tw:max-sm:text-base"
            placeholder={`Find a ${nouns}…`}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>No matching {nouns}</CommandEmpty>
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
            {kinds.map(({ kind, members }) =>
              // The many small places would swamp the list; they join it once something is typed.
              kind.listed || search.trim() ? (
                <Fragment key={kind.prefix}>
                  <CommandSeparator />
                  <CommandGroup heading={kind.heading}>
                    {members.map((region) => regionItem(region, kind))}
                  </CommandGroup>
                </Fragment>
              ) : null
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

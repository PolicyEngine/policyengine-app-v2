import { useState } from 'react';
import { IconCheck, IconChevronDown, IconScale } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
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
import { useReformStore, useV3SavedWork } from '@/hooks/useFlagshipStores';
import { provisionAdjusts, provisionIntervals, type DraftReform } from '@/libs/draftReform';
import { sameReformParameters } from '@/libs/flagship/reformMatch';
import type { RunReportBaseline } from '@/libs/flagship/runReport';
import { RootState } from '@/store';
import type { Reform } from '@/types/ingredients/Reform';

export const CURRENT_LAW_LABEL = 'Current law';

/** A saved reform's name, as Your reforms shows it. */
export function savedReformName(reform: Pick<Reform, 'label'>): string {
  return reform.label || 'Untitled reform';
}

/**
 * The draft's comparison: the saved reforms it can be compared with (the
 * list Your reforms shows, less the one the draft edits and any that set
 * nothing), the chosen one once they load, and what the run takes of it.
 */
export function useDraftBaseline(draft: DraftReform) {
  const currentLaw = useSelector((state: RootState) => state.metadata.parameters);
  // This session's saved reforms, cached under the key Your reforms uses.
  const reformStore = useReformStore();
  const { scope } = useV3SavedWork();
  const { data: saved, isPending } = useQuery({
    queryKey: ['reforms', scope, draft.countryId],
    queryFn: () => reformStore.findMine(draft.countryId),
  });
  // A reform that sets nothing runs as current law, so it is not offered.
  const options = (saved ?? []).filter(
    (reform) => !!reform.id && reform.id !== draft.editingReformId && reform.parameters.length > 0
  );
  // A comparison no longer saved reads, and runs, as current law.
  const reform = draft.baselineReformId
    ? options.find((option) => option.id === draft.baselineReformId)
    : undefined;
  const forRun: RunReportBaseline | undefined = reform && {
    reformId: reform.id,
    label: savedReformName(reform),
    parameters: reform.parameters,
  };
  // What each side changes in the run: only the values that differ from
  // current law, as the run sends the draft's.
  const draftChanges = draft.provisions
    .filter((provision) => provisionAdjusts(provision, currentLaw?.[provision.path]?.values))
    .map((provision) => ({ name: provision.path, values: provisionIntervals(provision) }));
  const baselineChanges = (reform?.parameters ?? []).filter((parameter) =>
    provisionAdjusts(
      { value: parameter.values[0]?.value, baselineValue: undefined, intervals: parameter.values },
      currentLaw?.[parameter.name]?.values
    )
  );
  return {
    options,
    reform,
    forRun,
    /** The chosen comparison is not known until the saved reforms load. */
    pending: !!draft.baselineReformId && isPending,
    /** The draft changes just what its comparison changes: the report would show no change. */
    matchesDraft:
      !!reform && draftChanges.length > 0 && sameReformParameters(baselineChanges, draftChanges),
  };
}

/** Matches a reform by any word of its name, not cmdk's fuzzy default. */
function nameFilter(_value: string, search: string, keywords?: string[]): number {
  const query = search.trim().toLowerCase();
  if (!query) {
    return 1;
  }
  const name = (keywords?.[0] ?? '').toLowerCase();
  if (name.startsWith(query)) {
    return 1;
  }
  return name.split(/\s+/).some((word) => word.startsWith(query)) ? 0.8 : 0;
}

interface BaselinePickerProps {
  /** The saved reform compared with; current law when unset. */
  value: string | undefined;
  onChange: (reformId: string | undefined) => void;
  /** The saved reforms on offer. */
  reforms: Reform[];
}

/**
 * What the report compares the reform with: current law, or one of the
 * reforms saved in Your reforms. It sits beside the year and population
 * pickers and reads the same way: "Compared with Current law".
 */
export default function BaselinePicker({ value, onChange, reforms }: BaselinePickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const selected = value ? reforms.find((reform) => reform.id === value) : undefined;
  const currentLabel = selected ? savedReformName(selected) : CURRENT_LAW_LABEL;

  const choose = (reformId: string | undefined) => {
    onChange(reformId);
    setOpen(false);
    setSearch('');
  };

  const check = (isSelected: boolean) => (
    <IconCheck
      size={14}
      aria-hidden
      style={{
        flexShrink: 0,
        color: colors.primary[600],
        visibility: isSelected ? 'visible' : 'hidden',
      }}
    />
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
          aria-label={`Compared with: ${currentLabel}`}
          className="tw:inline-flex tw:h-9 tw:cursor-pointer tw:items-center tw:rounded-md tw:border tw:border-input tw:bg-white tw:px-3 tw:text-sm tw:whitespace-nowrap tw:shadow-xs tw:transition-colors tw:hover:border-primary-500"
          style={{ gap: spacing.sm, fontFamily: typography.fontFamily.primary, maxWidth: '100%' }}
        >
          <span aria-hidden style={{ display: 'inline-flex', color: colors.text.tertiary }}>
            <IconScale size={16} />
          </span>
          {/* On a phone the icon says it; the choice keeps the room. */}
          <span
            className="tw:hidden tw:sm:inline"
            style={{ fontSize: typography.fontSize.xs, color: colors.text.tertiary }}
          >
            Compared with
          </span>
          <span
            className="tw:truncate"
            style={{
              maxWidth: 200,
              fontWeight: typography.fontWeight.medium,
              color: colors.text.primary,
            }}
          >
            {currentLabel}
          </span>
          <IconChevronDown
            size={14}
            aria-hidden
            style={{
              flexShrink: 0,
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
        <Command filter={nameFilter} label="Find a saved reform">
          {reforms.length > 0 && (
            <CommandInput
              // 16px on a phone, so the browser does not zoom in to type.
              className="tw:max-sm:text-base"
              placeholder="Find a saved reform…"
              value={search}
              onValueChange={setSearch}
            />
          )}
          <CommandList>
            <CommandEmpty>No matching reform</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="current-law"
                keywords={[CURRENT_LAW_LABEL]}
                onSelect={() => choose(undefined)}
                style={{ justifyContent: 'space-between', cursor: 'pointer' }}
              >
                <span>{CURRENT_LAW_LABEL}</span>
                {check(!selected)}
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Your reforms">
              {reforms.length === 0 ? (
                <CommandItem value="no-saved-reforms" disabled>
                  <span style={{ color: colors.text.tertiary }}>No saved reforms yet</span>
                </CommandItem>
              ) : (
                reforms.map((reform) => (
                  <CommandItem
                    key={reform.id}
                    value={reform.id}
                    keywords={[savedReformName(reform)]}
                    onSelect={() => choose(reform.id)}
                    style={{ justifyContent: 'space-between', gap: spacing.sm, cursor: 'pointer' }}
                  >
                    <span className="tw:truncate">{savedReformName(reform)}</span>
                    {check(reform.id === selected?.id)}
                  </CommandItem>
                ))
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

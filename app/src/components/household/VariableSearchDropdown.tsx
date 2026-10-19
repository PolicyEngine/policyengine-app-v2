/**
 * VariableSearchDropdown - Search input with inline results for adding variables
 * Renders the results list in normal document flow so parent layouts can expand.
 */

import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { IconChevronDown, IconSearch, IconX } from '@tabler/icons-react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Spinner,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui';
import { cn } from '@/lib/utils';
import { VariableInfo } from '@/utils/VariableResolver';

export interface VariableSearchDropdownProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onFocusChange: (focused: boolean) => void;
  filteredVariables: VariableInfo[];
  onSelect: (variable: VariableInfo) => void;
  /** Function to get entity hint for a variable (e.g., "Person" or "Household") */
  getEntityHint?: (variable: VariableInfo) => { show: boolean; label: string } | null;
  disabled?: boolean;
  placeholder?: string;
  /** Show loading spinner in dropdown */
  loading?: boolean;
  /** Called when user clicks the X button to close the dropdown entirely */
  onClose?: () => void;
  /** Whether results were truncated (more available than displayed) */
  truncated?: boolean;
  /** Variables listed first under their own heading; the rest follow under "All variables". */
  suggested?: ReadonlyMap<string, number>;
  suggestedLabel?: string;
  /** With `groupOf`: the dialog's title. */
  title?: string;
  /**
   * Groups the list (with chips to show one group) when given; the plain
   * list otherwise. The order names the groups in the order they show.
   */
  groupOf?: (variable: VariableInfo) => string;
  groupOrder?: readonly string[];
}

/** In the grouped list's "All" view, each group shows this many before "Show all". */
const GROUP_PREVIEW = 6;
const SUGGESTED_GROUP = '__suggested';

interface VariableSection {
  key: string;
  label: string;
  items: VariableInfo[];
  /** Variables in the group beyond those shown. */
  more: number;
}

// Fixed width for close button column (matches VariableRow's REMOVE_COLUMN_WIDTH)
const CLOSE_COLUMN_WIDTH = 22;

/**
 * Capitalize first letter only, preserving the rest of the string as-is.
 * This enforces sentence casing without lowercasing capitals in the middle.
 */
function sentenceCaseLabel(label: string): string {
  if (!label) {
    return '';
  }
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export default function VariableSearchDropdown({
  searchValue,
  onSearchChange,
  onFocusChange,
  filteredVariables,
  onSelect,
  getEntityHint,
  disabled = false,
  truncated = false,
  placeholder = 'Search for a variable...',
  loading = false,
  onClose,
  suggested,
  suggestedLabel = 'Suggested',
  groupOf,
  title = 'Add a variable',
  groupOrder = [],
}: VariableSearchDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  // The group the grouped list shows; all of them when null.
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Sort so matching-context variables appear first (within the suggested ones, then the rest)
  const sortedVariables = useMemo(() => {
    const byContext = (list: VariableInfo[]) => {
      if (!getEntityHint) {
        return list;
      }
      const matching: VariableInfo[] = [];
      const different: VariableInfo[] = [];
      for (const v of list) {
        if (getEntityHint(v)?.show) {
          different.push(v);
        } else {
          matching.push(v);
        }
      }
      return [...matching, ...different];
    };
    if (!suggested) {
      return byContext(filteredVariables);
    }
    return [
      ...byContext(filteredVariables.filter((v) => suggested.has(v.name))),
      ...byContext(filteredVariables.filter((v) => !suggested.has(v.name))),
    ];
  }, [filteredVariables, getEntityHint, suggested]);
  const suggestedCount = suggested
    ? sortedVariables.filter((v) => suggested.has(v.name)).length
    : 0;

  // The grouped list: its chips (every group with a match) and its sections.
  const grouped = useMemo(() => {
    if (!groupOf) {
      return null;
    }
    const byGroup = new Map<string, VariableInfo[]>();
    for (const variable of sortedVariables) {
      if (suggested?.has(variable.name)) {
        continue;
      }
      const group = groupOf(variable);
      byGroup.set(group, [...(byGroup.get(group) ?? []), variable]);
    }
    const rank = (group: string) => {
      const index = groupOrder.indexOf(group);
      return index === -1 ? groupOrder.length : index;
    };
    const all: VariableSection[] = [
      ...(suggestedCount > 0
        ? [
            {
              key: SUGGESTED_GROUP,
              label: suggestedLabel,
              items: sortedVariables.filter((v) => suggested?.has(v.name)),
              more: 0,
            },
          ]
        : []),
      ...[...byGroup.entries()]
        .sort(([a], [b]) => rank(a) - rank(b) || a.localeCompare(b))
        .map(([group, items]) => ({ key: group, label: group, items, more: 0 })),
    ];
    const chosen = all.find((section) => section.key === activeGroup);
    const sections = chosen
      ? [chosen]
      : all.map((section) => ({
          ...section,
          items: section.items.slice(0, GROUP_PREVIEW),
          more: Math.max(0, section.items.length - GROUP_PREVIEW),
        }));
    return { chips: all, sections };
  }, [
    groupOf,
    groupOrder,
    sortedVariables,
    suggested,
    suggestedCount,
    suggestedLabel,
    activeGroup,
  ]);
  // The options in the order they show: the grouped list's, or the plain one.
  const displayVariables = grouped
    ? grouped.sections.flatMap((section) => section.items)
    : sortedVariables;

  // Reset selected index when list changes
  useEffect(() => {
    setSelectedIndex(-1);
  }, [sortedVariables, activeGroup]);

  const openDropdown = () => {
    setIsOpen(true);
    onFocusChange(true);
  };

  const closeDropdown = () => {
    setIsOpen(false);
    setSelectedIndex(-1);
    onFocusChange(false);
  };

  // Delayed to let a click on an option land; focus that moved into the
  // list (the phone's category choice) keeps it open.
  const closeUnlessFocusInside = () => {
    setTimeout(() => {
      const focused = document.activeElement;
      if (focused && (focused === inputRef.current || listRef.current?.contains(focused))) {
        return;
      }
      closeDropdown();
    }, 150);
  };

  const handleSelect = (variable: VariableInfo) => {
    onSelect(variable);
    closeDropdown();
  };

  const handleClose = () => {
    closeDropdown();
    onClose?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, displayVariables.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      handleSelect(displayVariables[selectedIndex]);
    }
  };

  // Scroll selected option into view
  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[data-option]');
      items[selectedIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  // Auto-focus input
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Grouped, the search is a dialog of its own, centered over the page: a
  // list in place takes the width of where it opens — in a person card,
  // too narrow for the categories and the variables side by side.
  if (grouped) {
    return (
      <Dialog
        open
        onOpenChange={(open) => {
          if (!open) {
            handleClose();
          }
        }}
      >
        <DialogContent
          aria-describedby={undefined}
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            inputRef.current?.focus();
          }}
          className="tw:flex tw:h-[min(40rem,85vh)] tw:flex-col tw:gap-0 tw:overflow-hidden tw:bg-white tw:p-0 tw:sm:max-w-[56rem]"
        >
          <div className="tw:border-b tw:border-gray-100 tw:p-4 tw:pr-12">
            <DialogTitle className="tw:mb-3 tw:text-base">{title}</DialogTitle>
            <div className="tw:relative">
              <IconSearch
                size={16}
                className="tw:absolute tw:left-2.5 tw:top-1/2 tw:-translate-y-1/2 tw:text-gray-400 tw:pointer-events-none"
              />
              <input
                ref={inputRef}
                className={cn(
                  'tw:w-full tw:h-9 tw:pl-8 tw:pr-3 tw:rounded-element tw:border tw:border-gray-300',
                  'tw:text-sm tw:outline-none tw:focus:border-primary-500 tw:focus:ring-1 tw:focus:ring-primary-500',
                  disabled && 'tw:opacity-50 tw:cursor-not-allowed'
                )}
                placeholder={placeholder}
                value={searchValue}
                onChange={(e) => onSearchChange(e.currentTarget.value)}
                onKeyDown={handleKeyDown}
                disabled={disabled}
                autoFocus
              />
            </div>
          </div>
          <div ref={listRef} className="tw:flex tw:min-h-0 tw:flex-1 tw:flex-col">
            {grouped.chips.length > 1 && (
              // On a phone the categories are one compact choice above the list.
              <div className="tw:border-b tw:border-gray-100 tw:p-2 tw:sm:hidden">
                <select
                  aria-label="Variable category"
                  value={activeGroup ?? ''}
                  onChange={(e) => setActiveGroup(e.currentTarget.value || null)}
                  onBlur={closeUnlessFocusInside}
                  className="tw:h-8 tw:w-full tw:rounded-element tw:border tw:border-gray-200 tw:bg-white tw:px-2 tw:text-sm"
                >
                  <option value="">All categories</option>
                  {grouped.chips.map((chip) => (
                    <option key={chip.key} value={chip.key}>
                      {chip.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="tw:flex tw:min-h-0 tw:flex-1">
              {grouped.chips.length > 1 && (
                // Wider, the categories are a column beside the list: every one
                // in view at once, read top to bottom, none scrolled out of sight.
                <div
                  role="group"
                  aria-label="Variable groups"
                  className="tw:hidden tw:w-52 tw:shrink-0 tw:flex-col tw:gap-px tw:overflow-y-auto tw:border-r tw:border-gray-100 tw:p-1 tw:sm:flex"
                >
                  {[{ key: null, label: 'All categories' }, ...grouped.chips].map((chip) => (
                    <button
                      key={chip.key ?? 'all'}
                      type="button"
                      aria-pressed={activeGroup === chip.key}
                      // Keeps the search focused, so the list stays open.
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setActiveGroup(chip.key);
                      }}
                      className={cn(
                        'tw:flex tw:w-full tw:cursor-pointer tw:items-center tw:rounded-md tw:px-2 tw:py-1.5 tw:text-left tw:text-sm tw:transition-colors',
                        activeGroup === chip.key
                          ? 'tw:bg-primary-50 tw:font-medium tw:text-primary-700'
                          : 'tw:text-gray-700 tw:hover:bg-gray-50'
                      )}
                    >
                      <span className="tw:min-w-0 tw:truncate">{chip.label}</span>
                    </button>
                  ))}
                </div>
              )}
              <div className="tw:min-w-0 tw:flex-1 tw:overflow-y-auto tw:p-1">
                {loading ? (
                  <div className="tw:flex tw:items-center tw:justify-center tw:p-md">
                    <Spinner size="sm" />
                  </div>
                ) : displayVariables.length === 0 ? (
                  <p className="tw:text-sm tw:text-gray-500 tw:p-md tw:text-center">
                    No variables found
                  </p>
                ) : (
                  grouped.sections.map((section) => {
                    const offset = displayVariables.indexOf(section.items[0]);
                    return (
                      <div key={section.key} className="tw:pb-1">
                        <p
                          role="presentation"
                          className="tw:sticky tw:top-0 tw:z-10 tw:bg-white tw:px-2 tw:pt-2 tw:pb-1 tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-gray-500"
                        >
                          {section.label}
                        </p>
                        {section.items.map((variable, at) => {
                          const index = offset + at;
                          const entityHint = getEntityHint?.(variable);
                          return (
                            <div
                              key={variable.name}
                              data-option
                              role="option"
                              tabIndex={-1}
                              aria-selected={index === selectedIndex}
                              className={cn(
                                'tw:flex tw:cursor-pointer tw:items-start tw:justify-between tw:gap-2 tw:rounded-md tw:px-2 tw:py-1.5',
                                index === selectedIndex ? 'tw:bg-primary-50' : 'tw:hover:bg-gray-50'
                              )}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleSelect(variable);
                              }}
                            >
                              <div className="tw:min-w-0 tw:flex-1">
                                <p className="tw:truncate tw:text-sm tw:text-gray-900">
                                  {sentenceCaseLabel(variable.label)}
                                </p>
                                {variable.documentation && (
                                  <p className="tw:line-clamp-1 tw:text-xs tw:text-gray-500">
                                    {variable.documentation}
                                  </p>
                                )}
                              </div>
                              {entityHint?.show && (
                                <span className="tw:shrink-0 tw:rounded tw:bg-gray-100 tw:px-1.5 tw:py-0.5 tw:text-[11px] tw:text-gray-600">
                                  {entityHint.label}
                                </span>
                              )}
                            </div>
                          );
                        })}
                        {section.more > 0 && (
                          <button
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setActiveGroup(section.key);
                            }}
                            className="tw:cursor-pointer tw:px-2 tw:py-1 tw:text-xs tw:font-medium tw:text-primary-700 tw:hover:underline"
                          >
                            Show all {section.items.length + section.more}
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="tw:flex tw:items-start tw:gap-xs tw:flex-nowrap">
      <div className="tw:flex-1 tw:min-w-0">
        <div className="tw:relative">
          <IconSearch
            size={16}
            className="tw:absolute tw:left-2.5 tw:top-1/2 tw:-translate-y-1/2 tw:text-gray-400 tw:pointer-events-none"
          />
          <input
            ref={inputRef}
            className={cn(
              'tw:w-full tw:h-9 tw:pl-8 tw:pr-8 tw:rounded-element tw:border tw:border-gray-300',
              'tw:text-sm tw:outline-none tw:focus:border-primary-500 tw:focus:ring-1 tw:focus:ring-primary-500',
              disabled && 'tw:opacity-50 tw:cursor-not-allowed'
            )}
            placeholder={placeholder}
            value={searchValue}
            onChange={(e) => {
              onSearchChange(e.currentTarget.value);
              if (!isOpen) {
                openDropdown();
              }
            }}
            onClick={openDropdown}
            onFocus={openDropdown}
            onBlur={closeUnlessFocusInside}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            autoFocus
          />
          <IconChevronDown
            size={14}
            className="tw:absolute tw:right-2.5 tw:top-1/2 tw:-translate-y-1/2 tw:text-gray-400 tw:pointer-events-none"
          />
        </div>

        {isOpen && !grouped && (
          <div
            ref={listRef}
            className="tw:mt-1 tw:w-full tw:bg-white tw:border tw:border-gray-200 tw:rounded-element tw:shadow-lg tw:max-h-[200px] tw:overflow-y-auto"
          >
            {loading ? (
              <div className="tw:flex tw:items-center tw:justify-center tw:p-md">
                <Spinner size="sm" />
              </div>
            ) : sortedVariables.length > 0 ? (
              <>
                {sortedVariables.map((variable, index) => {
                  const entityHint = getEntityHint?.(variable);
                  const heading =
                    suggestedCount > 0 && index === 0
                      ? suggestedLabel
                      : suggestedCount > 0 && index === suggestedCount
                        ? 'All variables'
                        : null;
                  return (
                    <Fragment key={variable.name}>
                      {heading && (
                        <p
                          role="presentation"
                          className="tw:px-sm tw:pt-sm tw:pb-xs tw:text-xs tw:font-semibold tw:text-gray-500"
                        >
                          {heading}
                        </p>
                      )}
                      <div
                        data-option
                        role="option"
                        tabIndex={-1}
                        aria-selected={index === selectedIndex}
                        className={cn(
                          'tw:px-sm tw:py-xs tw:cursor-pointer tw:text-sm',
                          index === selectedIndex ? 'tw:bg-primary-100' : 'tw:hover:bg-gray-50'
                        )}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSelect(variable);
                        }}
                      >
                        <div className="tw:flex tw:items-start tw:gap-xs tw:justify-between tw:flex-nowrap">
                          <div className="tw:flex-1 tw:min-w-0">
                            <p className="tw:text-sm tw:truncate">
                              {sentenceCaseLabel(variable.label)}
                            </p>
                            {variable.documentation && (
                              <p className="tw:text-xs tw:text-gray-500 tw:line-clamp-1">
                                {variable.documentation}
                              </p>
                            )}
                          </div>
                          {entityHint?.show && (
                            <span className="tw:text-xs tw:text-gray-500 tw:italic tw:shrink-0">
                              {entityHint.label}
                            </span>
                          )}
                        </div>
                      </div>
                    </Fragment>
                  );
                })}
                {truncated && (
                  <p className="tw:text-xs tw:text-gray-500 tw:p-xs tw:text-center">
                    Type to search more variables...
                  </p>
                )}
              </>
            ) : (
              <p className="tw:text-sm tw:text-gray-500 tw:p-md tw:text-center">
                No variables found
              </p>
            )}
          </div>
        )}
      </div>
      {onClose && (
        <div className="tw:flex tw:items-center" style={{ width: CLOSE_COLUMN_WIDTH, height: 36 }}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={handleClose}
                disabled={disabled}
                style={{ width: CLOSE_COLUMN_WIDTH, height: CLOSE_COLUMN_WIDTH }}
              >
                <IconX size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Cancel</TooltipContent>
          </Tooltip>
        </div>
      )}
    </div>
  );
}

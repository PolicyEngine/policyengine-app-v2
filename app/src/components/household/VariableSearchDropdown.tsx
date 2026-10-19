/**
 * VariableSearchDropdown - Search input with inline results for adding variables
 * Renders the results list in normal document flow so parent layouts can expand.
 */

import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { IconChevronDown, IconSearch, IconX } from '@tabler/icons-react';
import VariablePickerDialog, {
  type CommonInput,
} from '@/components/household/VariablePickerDialog';
import { Button, Spinner, Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui';
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
  /**
   * With `groupOf`: a group's parts, shown as subheadings when that group
   * is chosen (Income → wages, investments, …), in `subgroupOrder`.
   */
  subgroupOf?: (variable: VariableInfo) => string | null;
  subgroupOrder?: readonly string[];
  /** With `groupOf`: the picker's tiles, topic icons and display names. */
  common?: CommonInput[];
  groupIcon?: (group: string) => ReactNode;
  nameOf?: (variable: VariableInfo) => string;
  /** With `groupOf`: the dialog's title. */
  title?: string;
  /**
   * Opens the search as a picker dialog (VariablePickerDialog), its inputs
   * in these groups, when given; the plain inline list otherwise. The
   * order names the groups in the order they show.
   */
  groupOf?: (variable: VariableInfo) => string;
  groupOrder?: readonly string[];
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
  subgroupOf,
  subgroupOrder = [],
  common,
  groupIcon,
  nameOf,
  groupOrder = [],
}: VariableSearchDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
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

  const displayVariables = sortedVariables;

  // Reset selected index when list changes
  useEffect(() => {
    setSelectedIndex(-1);
  }, [sortedVariables]);

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

  // Grouped, the search is a dialog of its own, centered over the page.
  if (groupOf) {
    return (
      <VariablePickerDialog
        title={title}
        searchValue={searchValue}
        onSearchChange={onSearchChange}
        variables={filteredVariables}
        onSelect={handleSelect}
        onClose={handleClose}
        groupOf={groupOf}
        groupOrder={groupOrder}
        groupIcon={groupIcon}
        subgroupOf={subgroupOf}
        subgroupOrder={subgroupOrder}
        common={common}
        suggested={suggested}
        suggestedLabel={suggestedLabel}
        nameOf={nameOf}
        loading={loading}
        disabled={disabled}
      />
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

        {isOpen && (
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

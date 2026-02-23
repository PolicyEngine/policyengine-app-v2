/**
 * VariableSearchDropdown - Search input with dropdown results for adding variables
 * Uses Popover + custom list for canonical dropdown behavior
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { IconChevronDown, IconSearch, IconX } from '@tabler/icons-react';
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
}: VariableSearchDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Sort so matching-context variables appear first
  const sortedVariables = useMemo(() => {
    if (!getEntityHint) {
      return filteredVariables;
    }
    const matching: VariableInfo[] = [];
    const different: VariableInfo[] = [];
    for (const v of filteredVariables) {
      if (getEntityHint(v)?.show) {
        different.push(v);
      } else {
        matching.push(v);
      }
    }
    return [...matching, ...different];
  }, [filteredVariables, getEntityHint]);

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
      setSelectedIndex((prev) => Math.min(prev + 1, sortedVariables.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      handleSelect(sortedVariables[selectedIndex]);
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

  return (
    <div className="tw:flex tw:items-center tw:gap-xs tw:flex-nowrap">
      <div className="tw:flex-1 tw:relative">
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
            onBlur={() => {
              // Delay to allow click on option
              setTimeout(closeDropdown, 150);
            }}
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
            className="tw:absolute tw:z-50 tw:w-full tw:mt-1 tw:bg-white tw:border tw:border-gray-200 tw:rounded-element tw:shadow-lg tw:max-h-[200px] tw:overflow-y-auto"
          >
            {loading ? (
              <div className="tw:flex tw:items-center tw:justify-center tw:p-md">
                <Spinner size="sm" />
              </div>
            ) : sortedVariables.length > 0 ? (
              <>
                {sortedVariables.map((variable, index) => {
                  const entityHint = getEntityHint?.(variable);
                  return (
                    <div
                      key={variable.name}
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
        <div style={{ width: CLOSE_COLUMN_WIDTH, height: CLOSE_COLUMN_WIDTH }}>
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

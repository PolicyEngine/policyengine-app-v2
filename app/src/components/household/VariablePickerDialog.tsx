/**
 * The household builder's variable picker as a dialog: the inputs most
 * households need first, as tiles, then topics to browse, and a search
 * across everything. A chosen topic lists its inputs by name, part by
 * part; the input under the pointer is described once, below the list.
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { IconArrowLeft, IconLayoutGrid, IconPlus, IconSearch } from '@tabler/icons-react';
import { Dialog, DialogContent, DialogTitle, Spinner } from '@/components/ui';
import { cn } from '@/lib/utils';
import { VariableInfo } from '@/utils/VariableResolver';

/** An input offered as a tile on the picker's first view. */
export interface CommonInput {
  name: string;
  /** A short name for the tile, e.g. "Rent" for `pre_subsidy_rent`. */
  label: string;
  icon: ReactNode;
}

export interface VariablePickerDialogProps {
  title: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  /** The inputs this picker offers, ranked by the search when there is one. */
  variables: VariableInfo[];
  onSelect: (variable: VariableInfo) => void;
  onClose: () => void;
  groupOf: (variable: VariableInfo) => string;
  groupOrder?: readonly string[];
  groupIcon?: (group: string) => ReactNode;
  subgroupOf?: (variable: VariableInfo) => string | null;
  subgroupOrder?: readonly string[];
  /** Tiles on the first view; those not among `variables` are left out. */
  common?: CommonInput[];
  /** Inputs the report's reform makes worth filling in, listed on the first view. */
  suggested?: ReadonlyMap<string, number>;
  suggestedLabel?: string;
  /** A display name for an input, where the model's label is long or technical. */
  nameOf?: (variable: VariableInfo) => string;
  placeholder?: string;
  loading?: boolean;
  disabled?: boolean;
}

const FEATURED = 9;
const RELATED_SHOWN = 6;
const SEARCH_SHOWN = 80;

function sentenceCase(label: string): string {
  return label ? label.charAt(0).toUpperCase() + label.slice(1) : label;
}

export default function VariablePickerDialog({
  title,
  searchValue,
  onSearchChange,
  variables,
  onSelect,
  onClose,
  groupOf,
  groupOrder = [],
  groupIcon,
  subgroupOf,
  subgroupOrder = [],
  common = [],
  suggested,
  suggestedLabel = 'Related to this reform',
  nameOf,
  placeholder = 'Search inputs, e.g. rent',
  loading = false,
  disabled = false,
}: VariablePickerDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [topic, setTopic] = useState<string | null>(null);
  const [pointed, setPointed] = useState(-1);
  const searching = searchValue.trim().length > 0;
  const name = (variable: VariableInfo) => nameOf?.(variable) ?? sentenceCase(variable.label);

  const byName = useMemo(() => new Map(variables.map((v) => [v.name, v])), [variables]);
  const tiles = useMemo(
    () => common.filter((input) => byName.has(input.name)).slice(0, FEATURED),
    [common, byName]
  );
  const related = useMemo(
    () =>
      suggested
        ? variables
            .filter((v) => suggested.has(v.name))
            .sort((a, b) => suggested.get(a.name)! - suggested.get(b.name)!)
            .slice(0, RELATED_SHOWN)
        : [],
    [variables, suggested]
  );
  const topics = useMemo(() => {
    const present = new Set(variables.map(groupOf));
    const rank = (group: string) => {
      const index = groupOrder.indexOf(group);
      return index === -1 ? groupOrder.length : index;
    };
    return [...present].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
  }, [variables, groupOf, groupOrder]);

  // The rows the list shows: the search's matches, a topic's inputs part by
  // part, or, on the first view, the reform's related inputs.
  const rows = useMemo(() => {
    if (searching) {
      return variables.slice(0, SEARCH_SHOWN);
    }
    if (topic) {
      const partRank = (v: VariableInfo) => {
        const index = subgroupOrder.indexOf(subgroupOf?.(v) ?? '');
        return index === -1 ? subgroupOrder.length : index;
      };
      return variables
        .filter((v) => groupOf(v) === topic)
        .sort((a, b) => partRank(a) - partRank(b) || name(a).localeCompare(name(b)));
    }
    return related;
    // `name` reads `nameOf`, which the dependencies cover.
  }, [searching, topic, variables, related, groupOf, subgroupOf, subgroupOrder, nameOf]);

  useEffect(() => setPointed(-1), [rows]);
  useEffect(() => {
    if (pointed >= 0) {
      const options = listRef.current?.querySelectorAll('[data-option]');
      options?.[pointed]?.scrollIntoView({ block: 'nearest' });
    }
  }, [pointed]);

  const openTopic = (group: string | null) => {
    setTopic(group);
    onSearchChange('');
    inputRef.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setPointed((at) => Math.min(at + 1, rows.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setPointed((at) => Math.max(at - 1, 0));
    } else if (e.key === 'Enter' && rows[pointed]) {
      e.preventDefault();
      onSelect(rows[pointed]);
    }
  };

  const described = rows[pointed];
  const firstView = !searching && !topic;

  const row = (variable: VariableInfo, index: number) => (
    <div
      key={variable.name}
      data-option
      role="option"
      tabIndex={-1}
      aria-selected={index === pointed}
      onMouseEnter={() => setPointed(index)}
      onMouseDown={(e) => {
        e.preventDefault();
        onSelect(variable);
      }}
      className={cn(
        'tw:group tw:flex tw:cursor-pointer tw:items-center tw:justify-between tw:gap-3 tw:border-b tw:border-gray-100 tw:px-1 tw:py-2.5 tw:text-sm tw:text-gray-900',
        index === pointed && 'tw:bg-primary-50/60'
      )}
    >
      <span className="tw:min-w-0 tw:truncate">{name(variable)}</span>
      <IconPlus
        size={15}
        aria-hidden
        className={cn(
          'tw:shrink-0',
          index === pointed ? 'tw:text-primary-600' : 'tw:text-gray-300'
        )}
      />
    </div>
  );

  // A topic's rows under their parts' headings.
  const topicRows = () =>
    rows.map((variable, index) => {
      const part = subgroupOf?.(variable) ?? null;
      const starts = !!part && (index === 0 || subgroupOf?.(rows[index - 1]) !== part);
      return (
        <div key={variable.name}>
          {starts && (
            <p
              role="presentation"
              className="tw:pt-5 tw:pb-1 tw:text-xs tw:font-medium tw:text-gray-500 tw:first:pt-1"
            >
              {part}
            </p>
          )}
          {row(variable, index)}
        </div>
      );
    });

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent
        aria-describedby={undefined}
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          inputRef.current?.focus();
        }}
        className="tw:flex tw:h-[min(42rem,88vh)] tw:flex-col tw:gap-0 tw:overflow-hidden tw:bg-white tw:p-0 tw:sm:max-w-[56rem]"
      >
        <div className="tw:px-6 tw:pt-5 tw:pb-4 tw:pr-14">
          <DialogTitle className="tw:mb-3 tw:text-lg tw:font-semibold">{title}</DialogTitle>
          <div className="tw:relative">
            <IconSearch
              size={18}
              aria-hidden
              className="tw:pointer-events-none tw:absolute tw:top-1/2 tw:left-3 tw:-translate-y-1/2 tw:text-gray-400"
            />
            <input
              ref={inputRef}
              value={searchValue}
              onChange={(e) => onSearchChange(e.currentTarget.value)}
              onKeyDown={onKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              aria-label="Search inputs"
              className="tw:h-11 tw:w-full tw:rounded-lg tw:border tw:border-gray-200 tw:bg-gray-50 tw:pr-3 tw:pl-10 tw:text-sm tw:outline-none tw:focus:border-primary-500 tw:focus:bg-white tw:focus:ring-1 tw:focus:ring-primary-500"
            />
          </div>
        </div>

        <div className="tw:flex tw:min-h-0 tw:flex-1 tw:border-t tw:border-gray-100">
          {/* The topics, always in reach beside the list on a wide screen. */}
          <nav
            aria-label="Variable groups"
            className="tw:hidden tw:w-52 tw:shrink-0 tw:flex-col tw:gap-0.5 tw:overflow-y-auto tw:border-r tw:border-gray-100 tw:p-3 tw:sm:flex"
          >
            {[null, ...topics].map((group) => {
              const active = !searching && topic === group;
              return (
                <button
                  key={group ?? 'overview'}
                  type="button"
                  aria-pressed={active}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    openTopic(group);
                  }}
                  className={cn(
                    'tw:flex tw:w-full tw:cursor-pointer tw:items-center tw:gap-2.5 tw:rounded-md tw:px-2.5 tw:py-2 tw:text-left tw:text-sm tw:transition-colors',
                    active
                      ? 'tw:bg-primary-50 tw:font-medium tw:text-primary-700'
                      : 'tw:text-gray-700 tw:hover:bg-gray-50'
                  )}
                >
                  <span className="tw:flex tw:shrink-0 tw:text-current" aria-hidden>
                    {group ? groupIcon?.(group) : <IconLayoutGrid size={16} />}
                  </span>
                  <span className="tw:min-w-0 tw:truncate">{group ?? 'Featured'}</span>
                </button>
              );
            })}
          </nav>

          <div ref={listRef} className="tw:min-w-0 tw:flex-1 tw:overflow-y-auto tw:px-6 tw:py-4">
            {loading ? (
              <div className="tw:flex tw:justify-center tw:p-8">
                <Spinner size="sm" />
              </div>
            ) : firstView ? (
              <div className="tw:flex tw:flex-col tw:gap-6">
                {tiles.length > 0 && (
                  <section>
                    <p className="tw:mb-2 tw:text-xs tw:font-medium tw:text-gray-500">Featured</p>
                    <div className="tw:grid tw:grid-cols-2 tw:gap-2 tw:sm:grid-cols-3">
                      {tiles.map((input) => (
                        <button
                          key={input.name}
                          type="button"
                          onClick={() => onSelect(byName.get(input.name)!)}
                          className="tw:flex tw:cursor-pointer tw:flex-col tw:items-start tw:gap-2 tw:rounded-lg tw:border tw:border-gray-200 tw:p-3 tw:text-left tw:transition-colors tw:hover:border-primary-300 tw:hover:bg-primary-50/40"
                        >
                          <span className="tw:flex tw:text-primary-600" aria-hidden>
                            {input.icon}
                          </span>
                          <span className="tw:text-sm tw:text-gray-900">{input.label}</span>
                        </button>
                      ))}
                    </div>
                  </section>
                )}
                {related.length > 0 && (
                  <section>
                    <p className="tw:mb-1 tw:text-xs tw:font-medium tw:text-gray-500">
                      {suggestedLabel}
                    </p>
                    <div role="listbox" aria-label={suggestedLabel}>
                      {related.map(row)}
                    </div>
                  </section>
                )}
                {/* On a phone the topics have no column: they are tiles here. */}
                <section className="tw:sm:hidden">
                  <p className="tw:mb-2 tw:text-xs tw:font-medium tw:text-gray-500">
                    Browse by topic
                  </p>
                  <div className="tw:grid tw:grid-cols-2 tw:gap-2">
                    {topics.map((group) => (
                      <button
                        key={group}
                        type="button"
                        onClick={() => openTopic(group)}
                        className="tw:flex tw:cursor-pointer tw:items-center tw:gap-2 tw:rounded-lg tw:border tw:border-gray-200 tw:p-3 tw:text-left tw:text-sm tw:text-gray-800"
                      >
                        <span className="tw:flex tw:text-primary-600" aria-hidden>
                          {groupIcon?.(group)}
                        </span>
                        {group}
                      </button>
                    ))}
                  </div>
                </section>
              </div>
            ) : (
              <>
                {topic && !searching && (
                  <button
                    type="button"
                    onClick={() => openTopic(null)}
                    className="tw:mb-2 tw:flex tw:cursor-pointer tw:items-center tw:gap-1 tw:text-xs tw:font-medium tw:text-primary-700 tw:sm:hidden"
                  >
                    <IconArrowLeft size={14} aria-hidden />
                    All topics
                  </button>
                )}
                <h3 className="tw:mb-1 tw:text-sm tw:font-semibold tw:text-gray-900">
                  {searching ? `Results for “${searchValue.trim()}”` : topic}
                </h3>
                {rows.length === 0 ? (
                  <p className="tw:py-8 tw:text-center tw:text-sm tw:text-gray-500">
                    No inputs match. Try another word.
                  </p>
                ) : (
                  <div role="listbox" aria-label={searching ? 'Search results' : topic!}>
                    {searching ? rows.map(row) : topicRows()}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* What the pointed-at input is, in one place. */}
        <div
          aria-live="polite"
          className="tw:h-[4.25rem] tw:shrink-0 tw:border-t tw:border-gray-100 tw:bg-gray-50 tw:px-6 tw:py-3"
        >
          {described ? (
            <>
              <p className="tw:truncate tw:text-sm tw:font-medium tw:text-gray-900">
                {name(described)}
              </p>
              <p className="tw:line-clamp-1 tw:text-xs tw:text-gray-600">
                {described.documentation || 'No description in the model.'}
              </p>
            </>
          ) : (
            <p className="tw:pt-2 tw:text-xs tw:text-gray-500">
              Point to an input to see what it means.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

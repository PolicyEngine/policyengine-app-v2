import { useMemo, useState } from 'react';
import { IconArrowRight, IconFolder, IconInfoCircle, IconSearch } from '@tabler/icons-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import {
  createParameterSearchIndex,
  DEFAULT_SEARCH_FILTERS,
  groupSearchResults,
  listStateCodes,
  ParameterSearchEntry,
  ParameterSearchFilters,
  ParameterSearchIndex,
  searchParameters,
} from '@/libs/parameterSearch';

interface ParameterSearchBoxProps {
  entries: ParameterSearchEntry[];
  onSelect: (entry: ParameterSearchEntry) => void;
  /** Prebuilt index (e.g. the store-memoized one); skips a rebuild per mount */
  index?: ParameterSearchIndex;
  placeholder?: string;
  /** Formatted current value for a result row, e.g. "$2,000" */
  currentValueFor?: (entry: ParameterSearchEntry) => string | null;
  /** Derived concept clusters for variant-aware matching */
  clusters?: string[][];
  /** State code → name, so the scope filter reads "California", not "CA only" */
  stateLabels?: Record<string, string>;
  /**
   * Called with a folder's parameter path when its header is clicked.
   * Search shows only the leaves that matched; this is how a reader gets
   * to the siblings that did not.
   */
  onOpenFolder?: (folderPath: string) => void;
  /**
   * Render results in the page flow rather than floating over it. Set
   * when something below needs to stay visible — a floating list would
   * sit on top of the very folder it just opened.
   */
  resultsInFlow?: boolean;
}

/**
 * The folder a leaf sits in: gov.irs.credits.ctc.amount →
 * gov.irs.credits.ctc.
 *
 * Bracket indices are not nodes in the policy tree — it stops at
 * `...eitc.max` and renders the brackets inside it — so a trailing
 * `[n]` is dropped. Pointing at `...max[0]` names a folder the tree
 * cannot reveal, and the reveal silently does nothing.
 */
function parentPath(path: string): string | null {
  const lastDot = path.lastIndexOf('.');
  if (lastDot <= 0) {
    return null;
  }
  return path.slice(0, lastDot).replace(/\[\d+\]$/, '');
}

const CONTRIB_EXPLANATION =
  'Policy options contributed to the model — proposed reforms and ' +
  'experimental provisions that are not current law.';

const RESULT_LIMIT = 20;

const badgeStyle: React.CSSProperties = {
  fontSize: 10,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  padding: '1px 6px',
  borderRadius: 999,
  whiteSpace: 'nowrap',
};

const controlShell: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: spacing.xs,
  padding: `4px ${spacing.sm}`,
  border: `1px solid ${colors.border.light}`,
  borderRadius: 8,
  background: colors.background.primary,
  fontSize: typography.fontSize.xs,
  fontFamily: typography.fontFamily.primary,
  color: colors.text.secondary,
  height: 30,
};

function capitalizeFirst(text: string): string {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}

function EntryBadges({ entry }: { entry: ParameterSearchEntry }) {
  return (
    <span style={{ display: 'flex', gap: spacing.xs, flexShrink: 0 }}>
      {entry.stateCode && (
        <span
          style={{
            ...badgeStyle,
            color: colors.text.secondary,
            background: colors.gray[50],
            border: `1px solid ${colors.border.light}`,
          }}
        >
          {entry.stateCode.toUpperCase()}
        </span>
      )}
      {entry.isContrib && (
        <span style={{ ...badgeStyle, color: colors.primary[700], background: colors.primary[50] }}>
          contributed
        </span>
      )}
    </span>
  );
}

/**
 * Typeahead over the full parameter index. Results mirror the model's
 * hierarchy: parameters sharing a folder cluster under a folder header
 * with indented children, standalone parameters follow. Scope filters
 * tame the state/contributed namespaces that dominate the index.
 */
export default function ParameterSearchBox({
  entries,
  onSelect,
  placeholder = 'Search any parameter, e.g. child tax credit amount',
  currentValueFor,
  clusters = [],
  stateLabels = {},
  onOpenFolder,
  resultsInFlow = false,
  index: providedIndex,
}: ParameterSearchBoxProps) {
  const [query, setQuery] = useState('');
  const [highlighted, setHighlighted] = useState(0);
  const [hoveredFolder, setHoveredFolder] = useState<string | null>(null);
  const [filters, setFilters] = useState<ParameterSearchFilters>(DEFAULT_SEARCH_FILTERS);

  const index = useMemo(
    () => providedIndex ?? createParameterSearchIndex(entries, clusters),
    [providedIndex, entries, clusters]
  );
  // Named states sort by name; any code the metadata does not name falls
  // to the end of the list under its bare code.
  const stateOptions = useMemo(
    () =>
      listStateCodes(entries)
        .map((code) => ({ code, label: stateLabels[code] ?? code.toUpperCase() }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [entries, stateLabels]
  );
  const groups = useMemo(
    () => groupSearchResults(searchParameters(index, query, RESULT_LIMIT, filters)),
    [index, query, filters]
  );
  const flatEntries = useMemo(() => groups.flatMap((group) => group.entries), [groups]);

  const select = (entry: ParameterSearchEntry) => {
    onSelect(entry);
    setQuery('');
    setHighlighted(0);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!flatEntries.length) {
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlighted((current) => Math.min(current + 1, flatEntries.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlighted((current) => Math.max(current - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      select(flatEntries[highlighted]);
    } else if (event.key === 'Escape') {
      setQuery('');
    }
  };

  let runningIndex = -1;

  return (
    <div style={{ position: 'relative' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing.sm,
          marginBottom: spacing.sm,
          flexWrap: 'wrap',
        }}
      >
        {stateOptions.length > 0 && (
          <label style={controlShell}>
            Scope
            <select
              value={filters.stateScope}
              onChange={(event) => setFilters({ ...filters, stateScope: event.target.value })}
              aria-label="State scope"
              style={{
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: typography.fontSize.xs,
                fontFamily: typography.fontFamily.primary,
                color: colors.text.primary,
                cursor: 'pointer',
              }}
            >
              <option value="all">All jurisdictions</option>
              <option value="federal">Federal only</option>
              <optgroup label="States">
                {stateOptions.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.label}
                  </option>
                ))}
              </optgroup>
            </select>
          </label>
        )}
        <div style={controlShell}>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing.xs,
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={filters.includeContrib}
              onChange={(event) => setFilters({ ...filters, includeContrib: event.target.checked })}
              aria-label="Include contributed parameters"
              style={{ accentColor: colors.primary[500], width: 13, height: 13, margin: 0 }}
            />
            Contributed
          </label>
          {/* Outside the label: a control inside it would toggle the filter. */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={CONTRIB_EXPLANATION}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: 0,
                  border: 'none',
                  background: 'transparent',
                  cursor: 'help',
                  color: colors.text.secondary,
                }}
              >
                <IconInfoCircle size={13} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" style={{ maxWidth: 240 }}>
              {CONTRIB_EXPLANATION}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing.sm,
          padding: `${spacing.md} ${spacing.lg}`,
          border: `1px solid ${colors.border.light}`,
          borderRadius: 10,
          background: colors.background.primary,
        }}
      >
        <IconSearch size={18} color={colors.text.secondary} style={{ flexShrink: 0 }} />
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setHighlighted(0);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label="Search parameters"
          role="combobox"
          aria-expanded={flatEntries.length > 0}
          aria-controls="parameter-search-results"
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            fontSize: typography.fontSize.base,
            fontFamily: typography.fontFamily.primary,
            background: 'transparent',
          }}
        />
      </div>

      {flatEntries.length > 0 && (
        <div
          id="parameter-search-results"
          role="listbox"
          style={{
            ...(resultsInFlow
              ? { position: 'relative' }
              : { position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20 }),
            marginTop: spacing.xs,
            border: `1px solid ${colors.border.light}`,
            borderRadius: 10,
            background: colors.background.primary,
            boxShadow: resultsInFlow ? 'none' : '0 8px 24px rgba(20, 32, 31, 0.12)',
            maxHeight: 420,
            overflowY: 'auto',
          }}
        >
          {groups.map((group) => {
            const isFolder = group.entries.length > 1 && group.folder;
            return (
              <div key={group.folder || group.entries[0].path}>
                {isFolder &&
                  (() => {
                    const folderPath = parentPath(group.entries[0].path);
                    const headerStyle: React.CSSProperties = {
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing.xs,
                      width: '100%',
                      padding: `${spacing.sm} ${spacing.lg} ${spacing.xs}`,
                      fontSize: typography.fontSize.xs,
                      fontFamily: typography.fontFamily.primary,
                      fontWeight: typography.fontWeight.semibold,
                      color: colors.text.secondary,
                      textAlign: 'left',
                    };
                    // Only a folder with a resolvable path can be opened;
                    // otherwise the header stays the label it was.
                    if (!onOpenFolder || !folderPath) {
                      return (
                        <div style={headerStyle}>
                          <IconFolder size={13} />
                          {group.folder}
                        </div>
                      );
                    }
                    const isHovered = hoveredFolder === folderPath;
                    return (
                      <button
                        type="button"
                        onClick={() => onOpenFolder(folderPath)}
                        onMouseEnter={() => setHoveredFolder(folderPath)}
                        onMouseLeave={() => setHoveredFolder(null)}
                        onFocus={() => setHoveredFolder(folderPath)}
                        onBlur={() => setHoveredFolder(null)}
                        title={`Open ${group.folder} in the policy tree`}
                        aria-label={`Open ${group.folder} in the policy tree`}
                        style={{
                          ...headerStyle,
                          border: 'none',
                          cursor: 'pointer',
                          // A folder header is the one row here that
                          // navigates rather than adds, so it has to look
                          // like something you can press.
                          color: isHovered ? colors.primary[700] : colors.text.secondary,
                          background: isHovered ? colors.primary[50] : 'transparent',
                          textDecoration: isHovered ? 'underline' : 'none',
                          textUnderlineOffset: 3,
                        }}
                      >
                        <IconFolder size={13} />
                        <span
                          style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {group.folder}
                        </span>
                        <IconArrowRight
                          size={12}
                          style={{
                            flexShrink: 0,
                            transform: isHovered ? 'translateX(2px)' : undefined,
                            transition: 'transform 120ms ease',
                          }}
                        />
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: typography.fontWeight.normal,
                            opacity: isHovered ? 1 : 0,
                            transition: 'opacity 120ms ease',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          open in tree
                        </span>
                      </button>
                    );
                  })()}
                {group.entries.map((entry) => {
                  runningIndex += 1;
                  const i = runningIndex;
                  return (
                    <button
                      key={entry.path}
                      type="button"
                      role="option"
                      aria-selected={i === highlighted}
                      onMouseEnter={() => setHighlighted(i)}
                      onClick={() => select(entry)}
                      style={{
                        display: 'block',
                        width: '100%',
                        textAlign: 'left',
                        padding: isFolder
                          ? `${spacing.xs} ${spacing.lg} ${spacing.xs} 40px`
                          : `${spacing.sm} ${spacing.lg}`,
                        border: 'none',
                        cursor: 'pointer',
                        background: i === highlighted ? colors.primary[50] : 'transparent',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: spacing.sm,
                          justifyContent: 'space-between',
                        }}
                      >
                        <span
                          style={{
                            fontSize: typography.fontSize.sm,
                            fontFamily: typography.fontFamily.primary,
                            color: colors.text.primary,
                            fontWeight: typography.fontWeight.medium,
                            // Without a zero min-width this column collapses to
                            // its longest word when a value runs long, stacking
                            // the label one word per line.
                            flex: 1,
                            minWidth: 0,
                          }}
                        >
                          {isFolder
                            ? capitalizeFirst(entry.label)
                            : entry.breadcrumb || entry.label}
                        </span>
                        <span
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: spacing.sm,
                            flexShrink: 0,
                            // List-valued parameters (a dozen variable names)
                            // must not push the label out of its own row.
                            maxWidth: '45%',
                          }}
                        >
                          {currentValueFor?.(entry) && (
                            <span
                              title={currentValueFor(entry) ?? undefined}
                              style={{
                                fontSize: typography.fontSize.xs,
                                fontFamily: typography.fontFamily.primary,
                                color: colors.primary[700],
                                fontWeight: typography.fontWeight.medium,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {currentValueFor(entry)}
                            </span>
                          )}
                          <EntryBadges entry={entry} />
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: typography.fontSize.xs,
                          fontFamily: typography.fontFamily.mono,
                          color: colors.text.secondary,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {entry.path}
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

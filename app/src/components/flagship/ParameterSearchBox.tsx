import { useMemo, useState } from 'react';
import { IconSearch } from '@tabler/icons-react';
import { colors, spacing, typography } from '@/designTokens';
import {
  countHiddenByFilters,
  createParameterSearchIndex,
  DEFAULT_SEARCH_FILTERS,
  listStateCodes,
  ParameterSearchEntry,
  ParameterSearchFilters,
  searchParameters,
} from '@/libs/parameterSearch';

interface ParameterSearchBoxProps {
  entries: ParameterSearchEntry[];
  onSelect: (entry: ParameterSearchEntry) => void;
  placeholder?: string;
}

const badgeStyle: React.CSSProperties = {
  fontSize: 10,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  padding: '1px 6px',
  borderRadius: 999,
  whiteSpace: 'nowrap',
};

/**
 * Typeahead over the full parameter index with scope filters: state
 * parameters (over half the US index) can be scoped to one state or
 * federal-only, and contributed/experimental parameters are hidden
 * unless opted in. Pure component: takes entries as a prop (connect via
 * selectParameterSearchEntries).
 */
export default function ParameterSearchBox({
  entries,
  onSelect,
  placeholder = 'Search any parameter, e.g. child tax credit amount',
}: ParameterSearchBoxProps) {
  const [query, setQuery] = useState('');
  const [highlighted, setHighlighted] = useState(0);
  const [filters, setFilters] = useState<ParameterSearchFilters>(DEFAULT_SEARCH_FILTERS);

  const index = useMemo(() => createParameterSearchIndex(entries), [entries]);
  const stateCodes = useMemo(() => listStateCodes(entries), [entries]);
  const results = useMemo(
    () => searchParameters(index, query, 10, filters),
    [index, query, filters]
  );
  const hiddenCount = useMemo(
    () => (query.trim().length >= 2 ? countHiddenByFilters(index, query, 10, filters) : 0),
    [index, query, filters]
  );

  const select = (entry: ParameterSearchEntry) => {
    onSelect(entry);
    setQuery('');
    setHighlighted(0);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!results.length) {
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlighted((current) => Math.min(current + 1, results.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlighted((current) => Math.max(current - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      select(results[highlighted]);
    } else if (event.key === 'Escape') {
      setQuery('');
    }
  };

  return (
    <div style={{ position: 'relative' }}>
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
          aria-expanded={results.length > 0}
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

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing.md,
          marginTop: spacing.sm,
          flexWrap: 'wrap',
        }}
      >
        {stateCodes.length > 0 && (
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing.xs,
              fontSize: typography.fontSize.xs,
              color: colors.text.secondary,
              fontFamily: typography.fontFamily.primary,
            }}
          >
            Scope
            <select
              value={filters.stateScope}
              onChange={(event) => setFilters({ ...filters, stateScope: event.target.value })}
              aria-label="State scope"
              style={{
                padding: `2px ${spacing.xs}`,
                border: `1px solid ${colors.border.light}`,
                borderRadius: 6,
                fontSize: typography.fontSize.xs,
                fontFamily: typography.fontFamily.primary,
                background: colors.background.primary,
                color: colors.text.primary,
              }}
            >
              <option value="all">All jurisdictions</option>
              <option value="federal">Federal only</option>
              {stateCodes.map((code) => (
                <option key={code} value={code}>
                  Federal + {code.toUpperCase()}
                </option>
              ))}
            </select>
          </label>
        )}
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing.xs,
            fontSize: typography.fontSize.xs,
            color: colors.text.secondary,
            fontFamily: typography.fontFamily.primary,
            cursor: 'pointer',
          }}
        >
          <input
            type="checkbox"
            checked={filters.includeContrib}
            onChange={(event) => setFilters({ ...filters, includeContrib: event.target.checked })}
            aria-label="Include contributed parameters"
          />
          Include contributed (experimental)
        </label>
        {hiddenCount > 0 && (
          <span style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
            {hiddenCount} {hiddenCount === 1 ? 'match' : 'matches'} hidden by filters
          </span>
        )}
      </div>

      {results.length > 0 && (
        <div
          id="parameter-search-results"
          role="listbox"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 20,
            marginTop: spacing.xs,
            border: `1px solid ${colors.border.light}`,
            borderRadius: 10,
            background: colors.background.primary,
            boxShadow: '0 8px 24px rgba(20, 32, 31, 0.12)',
            maxHeight: 360,
            overflowY: 'auto',
          }}
        >
          {results.map((entry, i) => (
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
                padding: `${spacing.sm} ${spacing.lg}`,
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
                  }}
                >
                  {entry.breadcrumb || entry.label}
                </span>
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
                    <span
                      style={{
                        ...badgeStyle,
                        color: colors.primary[700],
                        background: colors.primary[50],
                      }}
                    >
                      contributed
                    </span>
                  )}
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
          ))}
        </div>
      )}
    </div>
  );
}

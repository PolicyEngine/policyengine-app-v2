import { useMemo, useRef, useState } from 'react';
import { IconSearch } from '@tabler/icons-react';
import { colors, spacing, typography } from '@/designTokens';
import {
  createParameterSearchIndex,
  ParameterSearchEntry,
  searchParameters,
} from '@/libs/parameterSearch';

interface ParameterSearchBoxProps {
  entries: ParameterSearchEntry[];
  onSelect: (entry: ParameterSearchEntry) => void;
  placeholder?: string;
}

/**
 * Typeahead over the full parameter index. Pure component: takes entries
 * as a prop (connect via selectParameterSearchEntries) so it is testable
 * and reusable outside redux contexts.
 */
export default function ParameterSearchBox({
  entries,
  onSelect,
  placeholder = 'Search any parameter, e.g. child tax credit amount',
}: ParameterSearchBoxProps) {
  const [query, setQuery] = useState('');
  const [highlighted, setHighlighted] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const index = useMemo(() => createParameterSearchIndex(entries), [entries]);
  const results = useMemo(() => searchParameters(index, query), [index, query]);

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

      {results.length > 0 && (
        <div
          id="parameter-search-results"
          role="listbox"
          ref={listRef}
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
                  fontSize: typography.fontSize.sm,
                  fontFamily: typography.fontFamily.primary,
                  color: colors.text.primary,
                  fontWeight: typography.fontWeight.medium,
                }}
              >
                {entry.breadcrumb || entry.label}
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

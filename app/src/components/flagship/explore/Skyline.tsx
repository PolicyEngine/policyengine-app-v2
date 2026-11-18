import { colors, typography } from '@/designTokens';
import { reliefColor } from '@/libs/flagship/explore/reliefScale';

export interface SkylineRow {
  /** A state's two-letter code. */
  code: string;
  name: string;
  /** The formatted value. */
  value: string;
  /** The state's place on the scale, 0 to 1. */
  position: number;
}

interface SkylineProps {
  /** Every state with a value, highest first. */
  rows: SkylineRow[];
  /** What the row shows: "Every state, from the highest (18.1%) to the lowest (5.0%)". */
  caption: string;
  selected: string | null;
  hot: string | null;
  onHover: (code: string | null) => void;
  onSelect: (code: string) => void;
}

/**
 * Every state as one bar, tallest first: the page's index of states. A
 * bar is a button, so the row is also how a keyboard or a screen reader
 * reaches each state's value and chooses a state.
 */
export default function Skyline({ rows, caption, selected, hot, onHover, onSelect }: SkylineProps) {
  const hotRow = rows.find((row) => row.code === hot);
  return (
    <section aria-label="States, highest to lowest">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 6,
          fontSize: typography.fontSize.xs,
          color: colors.text.secondary,
        }}
      >
        <span>{caption}</span>
        <span aria-hidden style={{ whiteSpace: 'nowrap', color: colors.gray[900] }}>
          {hotRow ? `${hotRow.name}: ${hotRow.value}` : ''}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 64 }}>
        {rows.map((row) => {
          const marked = row.code === selected || row.code === hot;
          return (
            <button
              key={row.code}
              type="button"
              aria-label={`${row.name}: ${row.value}`}
              aria-pressed={row.code === selected}
              onClick={() => onSelect(row.code)}
              onMouseEnter={() => onHover(row.code)}
              onMouseLeave={() => onHover(null)}
              onFocus={() => onHover(row.code)}
              onBlur={() => onHover(null)}
              className="tw:cursor-pointer tw:motion-safe:transition-[height,opacity] tw:motion-safe:duration-500"
              style={{
                flex: 1,
                minWidth: 0,
                height: `${8 + row.position * 92}%`,
                padding: 0,
                border: 0,
                borderRadius: '2px 2px 0 0',
                background: reliefColor(0.14 + 0.86 * row.position),
                opacity: selected && !marked ? 0.45 : 1,
                outline: marked ? `2px solid ${colors.gray[900]}` : undefined,
                outlineOffset: 1,
              }}
            />
          );
        })}
      </div>
      <div
        aria-hidden
        className="tw:hidden tw:lg:flex"
        style={{ gap: 2, marginTop: 4, fontSize: 9, color: colors.text.secondary }}
      >
        {rows.map((row) => (
          <span
            key={row.code}
            style={{ flex: 1, minWidth: 0, overflow: 'hidden', textAlign: 'center' }}
          >
            {row.code}
          </span>
        ))}
      </div>
    </section>
  );
}

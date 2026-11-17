import { useState } from 'react';
import { colors, spacing, typography } from '@/designTokens';
import type { BaselineFile } from '@/libs/flagship/explore/baselineData';
import type { ColorScale } from '@/libs/flagship/explore/colorScale';
import type { ExploreMetric } from '@/libs/flagship/explore/exploreMetrics';

interface RegionRankingProps {
  file: BaselineFile;
  regions: string[];
  metric: ExploreMetric;
  scale: ColorScale;
  title: string;
  selected: string;
  onSelect: (region: string) => void;
}

/** Rows shown before "Show all". */
const FIRST_ROWS = 12;

/**
 * The map's values as a list, highest first: the way to every value by
 * keyboard and screen reader, and a quick read of the extremes.
 */
export default function RegionRanking({
  file,
  regions,
  metric,
  scale,
  title,
  selected,
  onSelect,
}: RegionRankingProps) {
  const [all, setAll] = useState(false);
  const rows = regions
    .map((region) => ({ region, value: file.regions[region]?.metrics[metric.key] }))
    .filter((row): row is { region: string; value: number } => row.value !== undefined)
    .sort((a, b) => b.value - a.value);
  const shown = all ? rows : rows.slice(0, FIRST_ROWS);
  const max = Math.max(...rows.map((row) => row.value), 0) || 1;

  return (
    <section aria-label={title} style={{ marginTop: spacing.lg }}>
      <h2
        style={{
          fontSize: typography.fontSize.base,
          fontWeight: typography.fontWeight.semibold,
          margin: `0 0 ${spacing.sm}`,
        }}
      >
        {title}
      </h2>
      <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {shown.map(({ region, value }) => (
          <li key={region}>
            <button
              type="button"
              onClick={() => onSelect(region)}
              aria-current={region === selected || undefined}
              className="tw:cursor-pointer tw:hover:bg-gray-50"
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(96px, 160px) 1fr 64px',
                gap: spacing.sm,
                alignItems: 'center',
                width: '100%',
                padding: '3px 0',
                border: 0,
                background: 'none',
                textAlign: 'left',
                fontSize: typography.fontSize.sm,
                fontWeight: region === selected ? typography.fontWeight.semibold : undefined,
              }}
            >
              <span>{file.regions[region]?.label ?? region}</span>
              <span
                aria-hidden
                style={{
                  height: 8,
                  borderRadius: 2,
                  width: `${(100 * value) / max}%`,
                  background: scale.color(value),
                }}
              />
              <span
                style={{
                  textAlign: 'right',
                  color: colors.text.secondary,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {metric.format(value)}
              </span>
            </button>
          </li>
        ))}
      </ol>
      {rows.length > FIRST_ROWS && (
        <button
          type="button"
          onClick={() => setAll((open) => !open)}
          className="tw:cursor-pointer"
          style={{
            marginTop: spacing.sm,
            border: 0,
            background: 'none',
            padding: 0,
            color: colors.text.link,
            fontSize: typography.fontSize.sm,
          }}
        >
          {all ? 'Show fewer' : `Show all ${rows.length}`}
        </button>
      )}
    </section>
  );
}

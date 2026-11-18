import type { ReactNode } from 'react';
import { Button } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import type { BaselineFile, BaselineMetricKey } from '@/libs/flagship/explore/baselineData';
import {
  DISTRICTS_HIDDEN_NOTE,
  formatCount,
  unitPlural,
  type ExploreMetric,
  type ShownLevel,
} from '@/libs/flagship/explore/exploreMetrics';
import { leversFor, type ReformLever } from '@/libs/flagship/explore/reformLevers';
import type { ReliefScale } from '@/libs/flagship/explore/reliefScale';
import MethodNote from './MethodNote';
import ThemeBreakdown from './ThemeBreakdown';

interface PlaceMarginProps {
  file: BaselineFile;
  /** "us" or "state/oh". */
  region: string;
  level: ShownLevel;
  metric: ExploreMetric;
  /** The place's value, where the page shows one. */
  value?: number;
  /** The figure a state is compared with, and what it is: "All states" or "United States". */
  comparison?: { value: number; label: string };
  /** State values, highest first, where the measure has them. */
  ranked: { region: string; name: string; value: number }[];
  scale: ReliefScale;
  onMetricChange: (key: BaselineMetricKey) => void;
  /** Opens Build for this place, at a rule when one is given. */
  onModel: (lever?: ReformLever) => void;
}

const heading = {
  margin: `0 0 ${spacing.sm}`,
  fontSize: typography.fontSize.xs,
  fontWeight: typography.fontWeight.semibold,
  color: colors.text.secondary,
} as const;
const rule = `1px solid ${colors.border.light}`;
const small = { display: 'block', fontSize: typography.fontSize.xs, color: colors.text.secondary };

function ordinal(n: number): string {
  const tens = n % 100;
  const suffix = tens > 10 && tens < 14 ? 'th' : (['th', 'st', 'nd', 'rd'][n % 10] ?? 'th');
  return `${n}${suffix}`;
}

/** The agency's unit, in the words the page uses. */
function agencyUnit(unit: string): string {
  return unit === 'persons' ? 'people' : unit;
}

/** Where a state stands among all states: one tick each, on the measure's scale. */
function RankScale({
  ranked,
  scale,
  value,
  comparison,
  format,
}: Pick<PlaceMarginProps, 'ranked' | 'scale' | 'comparison'> & {
  value: number;
  format: (value: number) => string;
}) {
  const left = (v: number) => `${scale.position(v) * 100}%`;
  return (
    <div aria-hidden>
      <div style={{ position: 'relative', height: 34, margin: '4px 0 2px' }}>
        <span
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 16,
            height: 1,
            background: colors.gray[400],
          }}
        />
        {ranked.map((row) => (
          <span
            key={row.region}
            style={{
              position: 'absolute',
              left: left(row.value),
              top: 11,
              width: 1,
              height: 11,
              background: colors.gray[400],
            }}
          />
        ))}
        {comparison && (
          <span
            style={{
              position: 'absolute',
              left: left(comparison.value),
              top: 5,
              width: 1,
              height: 23,
              background: colors.gray[900],
            }}
          />
        )}
        <span
          style={{
            position: 'absolute',
            left: left(value),
            top: 3,
            width: 9,
            height: 27,
            marginLeft: -4,
            borderRadius: 2,
            background: colors.primary[700],
          }}
        />
      </div>
      <div style={{ ...small, display: 'flex', justifyContent: 'space-between' }}>
        <span>{format(scale.low)}</span>
        {comparison && (
          <span>
            {comparison.label}: {format(comparison.value)}
          </span>
        )}
        <span>{format(scale.high)}</span>
      </div>
    </div>
  );
}

/**
 * The page's margin: what is true of the chosen place today, the rules
 * that change it (each one opens Build), the breakdowns, and how the
 * figure is measured.
 */
export default function PlaceMargin({
  file,
  region,
  level,
  metric,
  value,
  comparison,
  ranked,
  scale,
  onMetricChange,
  onModel,
}: PlaceMarginProps) {
  const place = file.regions[region];
  const name = level === 'nation' ? 'the United States' : (place?.label ?? region);
  const facts: { key: string; content: ReactNode }[] = [];

  const rank = ranked.findIndex((row) => row.region === region);
  if (level === 'state' && value !== undefined && rank >= 0) {
    facts.push({
      key: 'rank',
      content: (
        <>
          {ordinal(rank + 1)} highest of {ranked.length} states
          <RankScale
            ranked={ranked}
            scale={scale}
            value={value}
            comparison={comparison}
            format={metric.format}
          />
        </>
      ),
    });
  }
  const census = place?.benchmarks?.[metric.key];
  if (census) {
    facts.push({
      key: 'census',
      content: (
        <>
          The Census Bureau measures {metric.format(census.value)}
          <a
            href={census.url}
            target="_blank"
            rel="noreferrer"
            style={{ ...small, color: colors.text.link }}
          >
            {census.period}
          </a>
        </>
      ),
    });
  }
  const recipients = metric.recipients && place?.metrics[metric.recipients.key];
  const agency = place?.admin_counts?.[metric.key];
  if (metric.recipients && recipients !== undefined && value !== undefined) {
    facts.push({
      key: 'recipients',
      content: (
        <>
          PolicyEngine: {formatCount(recipients)} {unitPlural(metric.recipients.unit)}
          {agency && (
            <span style={small}>
              Agency count: {agency.qualifier ? `${agency.qualifier} ` : ''}
              {formatCount(agency.value)} {agencyUnit(agency.unit)} ({agency.source.split(' (')[0]},{' '}
              {agency.period.split(' (')[0]}
              {agency.note ? `; ${agency.note}` : ''}) ·{' '}
              <a
                href={agency.url}
                target="_blank"
                rel="noreferrer"
                style={{ color: colors.text.link }}
              >
                source
              </a>
            </span>
          )}
        </>
      ),
    });
  }
  if (level === 'nation' && ranked.length >= 6) {
    facts.push({
      key: 'ends',
      content: (
        <>
          Highest in{' '}
          {ranked
            .slice(0, 3)
            .map((row) => row.name)
            .join(', ')}
          <span style={small}>
            Lowest in{' '}
            {ranked
              .slice(-3)
              .reverse()
              .map((row) => row.name)
              .join(', ')}
          </span>
        </>
      ),
    });
  }

  return (
    <aside aria-label={`${name}: current law`}>
      {facts.length > 0 && (
        <>
          <h2 style={heading}>{level === 'nation' ? 'The country' : place?.label} today</h2>
          <ul
            style={{
              margin: `0 0 ${spacing.xl}`,
              padding: 0,
              listStyle: 'none',
              fontSize: typography.fontSize.sm,
              lineHeight: 1.45,
            }}
          >
            {facts.map((fact, index) => (
              <li
                key={fact.key}
                style={{ padding: `${spacing.sm} 0`, borderTop: index ? rule : undefined }}
              >
                {fact.content}
              </li>
            ))}
          </ul>
        </>
      )}

      <h2 style={heading}>Rules that change this</h2>
      <ul style={{ margin: `0 0 ${spacing.lg}`, padding: 0, listStyle: 'none' }}>
        {leversFor(metric).map((lever) => (
          <li key={lever.title} style={{ borderTop: rule }}>
            <button
              type="button"
              onClick={() => onModel(lever)}
              className="tw:group tw:w-full tw:cursor-pointer tw:text-left"
              style={{
                display: 'block',
                padding: `${spacing.sm} 0`,
                border: 0,
                background: 'none',
              }}
            >
              <span
                className="tw:group-hover:text-primary-700 tw:group-hover:underline"
                style={{
                  display: 'block',
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.semibold,
                  lineHeight: 1.3,
                  color: colors.gray[900],
                }}
              >
                {lever.title}
              </span>
              <span style={small}>{lever.why}</span>
            </button>
          </li>
        ))}
      </ul>
      <Button
        onClick={() => onModel()}
        className="tw:h-auto tw:min-h-10 tw:whitespace-normal tw:rounded-full tw:py-2 tw:text-left"
      >
        Build a reform for {name}
      </Button>

      {place && (
        <ThemeBreakdown
          place={place}
          level={level}
          metric={metric}
          onMetricChange={onMetricChange}
        />
      )}
      <MethodNote metric={metric} receipt={file.receipt} />
      {level === 'state' && (
        <p role="note" style={{ ...small, margin: `${spacing.lg} 0 0`, lineHeight: 1.5 }}>
          {DISTRICTS_HIDDEN_NOTE}
        </p>
      )}
    </aside>
  );
}

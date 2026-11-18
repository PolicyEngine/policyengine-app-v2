import { IconArrowRight } from '@tabler/icons-react';
import { Button } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import {
  NATION_REGION,
  regionLevel,
  type BaselineFile,
  type BaselineMetricKey,
} from '@/libs/flagship/explore/baselineData';
import {
  cautionFor,
  formatCount,
  HEADLINE_METRICS,
  NOT_FOR_DISTRICTS_NOTE,
  THEMES,
  unitPlural,
  type ExploreMetric,
} from '@/libs/flagship/explore/exploreMetrics';
import MethodNote from './MethodNote';
import ThemeBreakdown from './ThemeBreakdown';

interface PlaceCardProps {
  file: BaselineFile;
  region: string;
  metric: ExploreMetric;
  onMetricChange: (key: BaselineMetricKey) => void;
  /** Opens Build for this place. */
  onModel: () => void;
}

/** The agency's unit, in the words the card uses. */
function agencyUnit(unit: string): string {
  return unit === 'persons' ? 'people' : unit;
}

const smallText = { fontSize: typography.fontSize.sm, color: colors.text.secondary, margin: 0 };

/**
 * The chosen place's figures, inside the Explore panel (which names the
 * place): the measure's value, the country's beside it, the
 * official figure where one exists, the other measures, how we measure
 * it, and the way into Build for this place.
 */
export default function PlaceCard({
  file,
  region,
  metric,
  onMetricChange,
  onModel,
}: PlaceCardProps) {
  const level = regionLevel(region);
  const place = file.regions[region];
  const nation = file.regions[NATION_REGION];
  const value = place?.metrics[metric.key];
  const nationValue = nation?.metrics[metric.key];
  const benchmark = place?.benchmarks?.[metric.key];
  const recipients = metric.recipients && place?.metrics[metric.recipients.key];
  const adminCount = place?.admin_counts?.[metric.key];
  const notForDistricts = level === 'district' && metric.districts === false;
  const caution = notForDistricts
    ? (metric.notForDistrictsNote ?? NOT_FOR_DISTRICTS_NOTE)
    : cautionFor(metric, level);
  const name = place?.label ?? region;

  return (
    <section aria-label={`${name}: current law`} aria-live="polite">
      <div
        style={{
          fontSize: 40,
          fontWeight: typography.fontWeight.semibold,
          letterSpacing: '-0.02em',
          lineHeight: 1,
        }}
      >
        {value === undefined ? '—' : metric.format(value)}
      </div>
      <p style={{ ...smallText, color: colors.gray[700], marginTop: spacing.xs }}>
        {metric.valueLabel}
      </p>
      {level !== 'nation' && nationValue !== undefined && (
        <p style={{ ...smallText, marginTop: 2 }}>United States: {metric.format(nationValue)}</p>
      )}
      {benchmark && (
        <p style={{ ...smallText, marginTop: 2 }}>
          Census Bureau, {benchmark.period}: {metric.format(benchmark.value)} ·{' '}
          <a
            href={benchmark.url}
            target="_blank"
            rel="noreferrer"
            style={{ color: colors.text.link }}
          >
            source
          </a>
        </p>
      )}
      {metric.recipients && recipients !== undefined && (
        <p style={{ ...smallText, marginTop: 2 }}>
          PolicyEngine: {formatCount(recipients)} {unitPlural(metric.recipients.unit)}
        </p>
      )}
      {adminCount && (
        <p style={{ ...smallText, marginTop: 2 }}>
          Agency count: {formatCount(adminCount.value)} {agencyUnit(adminCount.unit)} (
          {adminCount.source.split(' (')[0]}, {adminCount.period.split(' (')[0]}) ·{' '}
          <a
            href={adminCount.url}
            target="_blank"
            rel="noreferrer"
            style={{ color: colors.text.link }}
          >
            source
          </a>
        </p>
      )}
      {caution && (
        <p
          role="note"
          style={{
            margin: `${spacing.sm} 0 0`,
            padding: `${spacing.xs} ${spacing.sm}`,
            borderRadius: spacing.radius.element,
            background: colors.background.tertiary,
            color: colors.text.warning,
            fontSize: typography.fontSize.xs,
          }}
        >
          {caution}
        </p>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: `${spacing.md} ${spacing.sm}`,
          marginTop: spacing.lg,
          paddingTop: spacing.md,
          borderTop: `1px solid ${colors.border.light}`,
        }}
      >
        {HEADLINE_METRICS.filter((other) => other.theme !== metric.theme).map((other) => {
          const otherValue = place?.metrics[other.key];
          return (
            <button
              key={other.key}
              type="button"
              onClick={() => onMetricChange(other.key)}
              className="tw:cursor-pointer tw:text-left tw:hover:text-primary-700"
              style={{ border: 0, background: 'none', padding: 0 }}
            >
              <span
                style={{
                  display: 'block',
                  fontSize: typography.fontSize.base,
                  fontWeight: typography.fontWeight.semibold,
                  color: colors.text.primary,
                }}
              >
                {otherValue === undefined ? '—' : other.format(otherValue)}
              </span>
              <span style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
                {THEMES.find((theme) => theme.key === other.theme)?.label}
                {other.theme === 'benefits' ? ` (${other.label})` : ''}
              </span>
            </button>
          );
        })}
      </div>

      {place && <ThemeBreakdown place={place} metric={metric} onMetricChange={onMetricChange} />}

      <Button
        onClick={onModel}
        className="tw:mt-lg tw:h-auto tw:min-h-10 tw:w-full tw:justify-between tw:whitespace-normal tw:py-2 tw:text-left"
      >
        Model a policy change for {level === 'nation' ? 'the United States' : name}
        <IconArrowRight aria-hidden />
      </Button>

      <MethodNote metric={metric} receipt={file.receipt} />
    </section>
  );
}

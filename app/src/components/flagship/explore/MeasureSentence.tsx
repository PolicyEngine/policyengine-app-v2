import { IconChevronDown } from '@tabler/icons-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import type { BaselineMetricKey } from '@/libs/flagship/explore/baselineData';
import {
  DISTRICTS_HIDDEN_NOTE,
  EXPLORE_METRICS,
  isShownAt,
  themeMetrics,
  THEMES,
  type ExploreMetric,
} from '@/libs/flagship/explore/exploreMetrics';

interface MeasureSentenceProps {
  metric: ExploreMetric;
  /** The formatted value for the place, or none where the page shows no value. */
  value?: string;
  onChange: (key: BaselineMetricKey) => void;
}

export function themeLabel(metric: ExploreMetric): string {
  return THEMES.find((theme) => theme.key === metric.theme)?.label ?? '';
}

/**
 * The page's one statement, "11.9% of people are in poverty", whose
 * words are the measure picker: they open every measure, grouped by
 * theme, and name the ones the page does not show yet, with the reason.
 */
export default function MeasureSentence({ metric, value, onChange }: MeasureSentenceProps) {
  const hidden = EXPLORE_METRICS.filter((m) => !isShownAt(m, 'nation'));
  return (
    <p
      style={{
        margin: 0,
        fontSize: 'clamp(20px, 2vw, 27px)',
        lineHeight: 1.25,
        letterSpacing: '-0.015em',
        fontWeight: typography.fontWeight.medium,
      }}
    >
      {value && <strong style={{ fontWeight: typography.fontWeight.bold }}>{value} </strong>}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={`Measure: ${themeLabel(metric)}, ${metric.label}. Change the measure`}
            className="tw:cursor-pointer tw:hover:text-primary-900"
            style={{
              display: 'inline',
              padding: 0,
              border: 0,
              borderBottom: '2px solid currentColor',
              background: 'none',
              color: colors.primary[700],
              font: 'inherit',
              fontWeight: typography.fontWeight.semibold,
              textAlign: 'left',
              lineHeight: 1.15,
            }}
          >
            {metric.valueLabel}
            <IconChevronDown
              size={20}
              aria-hidden
              style={{ display: 'inline', marginLeft: 6, verticalAlign: '-0.1em' }}
            />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="tw:max-h-[70vh] tw:w-[min(720px,calc(100vw-32px))] tw:overflow-y-auto"
          style={{ padding: spacing.lg }}
        >
          <DropdownMenuRadioGroup
            value={metric.key}
            onValueChange={(key) => onChange(key as BaselineMetricKey)}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: `${spacing.md} ${spacing.lg}`,
            }}
          >
            {THEMES.map((theme) => {
              const shown = themeMetrics(theme.key).filter((m) => isShownAt(m, 'nation'));
              return shown.length ? (
                <div key={theme.key} role="group" aria-label={theme.label}>
                  <div
                    style={{
                      marginBottom: 4,
                      fontSize: typography.fontSize.xs,
                      fontWeight: typography.fontWeight.semibold,
                      color: colors.text.secondary,
                    }}
                  >
                    {theme.label}
                  </div>
                  {shown.map((m) => (
                    <DropdownMenuRadioItem key={m.key} value={m.key} className="tw:cursor-pointer">
                      {m.label}
                      {!isShownAt(m, 'state') && (
                        <span
                          style={{
                            marginLeft: 6,
                            fontSize: 11,
                            color: colors.text.secondary,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          US only
                        </span>
                      )}
                    </DropdownMenuRadioItem>
                  ))}
                </div>
              ) : null;
            })}
          </DropdownMenuRadioGroup>
          <div
            role="note"
            style={{
              marginTop: spacing.lg,
              paddingTop: spacing.md,
              borderTop: `1px solid ${colors.border.light}`,
              fontSize: typography.fontSize.xs,
              color: colors.text.secondary,
            }}
          >
            <div
              style={{
                marginBottom: 6,
                fontWeight: typography.fontWeight.semibold,
                color: colors.gray[900],
              }}
            >
              Not shown yet
            </div>
            <dl
              style={{
                display: 'grid',
                gridTemplateColumns: 'max-content 1fr',
                gap: `4px ${spacing.md}`,
                margin: 0,
              }}
            >
              {hidden.map((m) => (
                <div key={m.key} style={{ display: 'contents' }}>
                  <dt>
                    {themeLabel(m)}: {m.label}
                  </dt>
                  <dd style={{ margin: 0 }}>{m.hiddenReason}</dd>
                </div>
              ))}
              <div style={{ display: 'contents' }}>
                <dt>Congressional districts</dt>
                <dd style={{ margin: 0 }}>{DISTRICTS_HIDDEN_NOTE}</dd>
              </div>
            </dl>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </p>
  );
}

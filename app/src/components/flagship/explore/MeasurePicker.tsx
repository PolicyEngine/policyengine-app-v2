import { Fragment } from 'react';
import { IconChevronDown } from '@tabler/icons-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import type { BaselineMetricKey } from '@/libs/flagship/explore/baselineData';
import { themeMetrics, THEMES, type ExploreMetric } from '@/libs/flagship/explore/exploreMetrics';

interface MeasurePickerProps {
  metric: ExploreMetric;
  onChange: (key: BaselineMetricKey) => void;
}

export function themeLabel(metric: ExploreMetric): string {
  return THEMES.find((theme) => theme.key === metric.theme)?.label ?? '';
}

/**
 * What the map shows: one button naming the measure ("Poverty · Children")
 * that opens every measure in one menu, grouped by theme.
 */
export default function MeasurePicker({ metric, onChange }: MeasurePickerProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Measure: ${themeLabel(metric)}, ${metric.label}. Change the measure`}
          className="tw:cursor-pointer tw:max-sm:min-h-10"
          style={{
            display: 'inline-flex',
            alignSelf: 'flex-start',
            flexShrink: 0,
            alignItems: 'center',
            gap: spacing.sm,
            maxWidth: '100%',
            padding: `6px ${spacing.md}`,
            borderRadius: 999,
            border: `1px solid ${colors.primary[600]}`,
            background: colors.primary[600],
            color: colors.white,
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.medium,
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {themeLabel(metric)}
            <span style={{ opacity: 0.75 }}> · {metric.label}</span>
          </span>
          <IconChevronDown size={16} aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="tw:max-h-[70vh] tw:w-64 tw:overflow-y-auto">
        <DropdownMenuRadioGroup
          value={metric.key}
          onValueChange={(key) => onChange(key as BaselineMetricKey)}
        >
          {THEMES.map((theme, index) => (
            <Fragment key={theme.key}>
              {index > 0 && <DropdownMenuSeparator />}
              <DropdownMenuLabel
                style={{
                  fontSize: typography.fontSize.xs,
                  color: colors.text.secondary,
                  fontWeight: typography.fontWeight.medium,
                }}
              >
                {theme.label}
              </DropdownMenuLabel>
              {themeMetrics(theme.key).map((m) => (
                <DropdownMenuRadioItem key={m.key} value={m.key} className="tw:cursor-pointer">
                  {m.label}
                </DropdownMenuRadioItem>
              ))}
            </Fragment>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

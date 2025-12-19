import { Box, Group, Text, ThemeIcon } from '@mantine/core';
import { IconArrowDown, IconArrowUp, IconMinus } from '@tabler/icons-react';
import { colors, spacing, typography } from '@/designTokens';

type MetricTrend = 'positive' | 'negative' | 'neutral';

interface MetricCardProps {
  /** Label describing the metric */
  label: string;
  /** The main value to display */
  value: string;
  /** Optional secondary value or context */
  subtext?: string;
  /** Trend direction for color coding */
  trend?: MetricTrend;
  /** Whether this is a "hero" (larger) metric */
  hero?: boolean;
  /** Optional description text */
  description?: string;
}

/**
 * MetricCard - Displays a single metric with optional trend indicator
 *
 * Used in Overview pages to show key statistics like budgetary impact,
 * poverty change, and net income effects.
 */
export default function MetricCard({
  label,
  value,
  subtext,
  trend = 'neutral',
  hero = false,
  description,
}: MetricCardProps) {
  const getTrendColor = () => {
    switch (trend) {
      case 'positive':
        return colors.primary[600];
      case 'negative':
        return colors.gray[600];
      default:
        return colors.gray[500];
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'positive':
        return <IconArrowUp size={hero ? 20 : 16} stroke={2.5} />;
      case 'negative':
        return <IconArrowDown size={hero ? 20 : 16} stroke={2.5} />;
      default:
        return <IconMinus size={hero ? 20 : 16} stroke={2.5} />;
    }
  };

  const trendColor = getTrendColor();

  return (
    <Box>
      {/* Label */}
      <Text
        size={hero ? 'sm' : 'xs'}
        fw={typography.fontWeight.medium}
        c={colors.text.secondary}
        tt="uppercase"
        style={{ letterSpacing: '0.05em' }}
      >
        {label}
      </Text>

      {/* Value with trend indicator */}
      <Group gap={spacing.sm} align="center" mt={spacing.xs}>
        {trend !== 'neutral' && (
          <ThemeIcon
            size={hero ? 32 : 24}
            radius="xl"
            variant="light"
            color={trend === 'positive' ? 'teal' : 'gray'}
          >
            {getTrendIcon()}
          </ThemeIcon>
        )}
        <Text
          fw={typography.fontWeight.bold}
          c={trendColor}
          style={{
            fontSize: hero ? '2.5rem' : '1.75rem',
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
          }}
        >
          {value}
        </Text>
      </Group>

      {/* Subtext */}
      {subtext && (
        <Text size="sm" c={colors.text.secondary} mt={spacing.xs}>
          {subtext}
        </Text>
      )}

      {/* Description */}
      {description && (
        <Text size="xs" c={colors.text.tertiary} mt={spacing.sm} style={{ lineHeight: 1.5 }}>
          {description}
        </Text>
      )}
    </Box>
  );
}

import { IconArrowDown, IconArrowUp, IconMinus } from '@tabler/icons-react';
import { colors } from '@/designTokens';

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
  /** Invert the arrow direction (useful when decrease is good, like poverty) */
  invertArrow?: boolean;
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
  invertArrow = false,
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
    // When invertArrow is true, flip the arrow direction
    // (useful for metrics like poverty where decrease is good)
    const showUpArrow = invertArrow ? trend === 'negative' : trend === 'positive';
    const showDownArrow = invertArrow ? trend === 'positive' : trend === 'negative';

    if (showUpArrow) {
      return <IconArrowUp size={hero ? 20 : 16} stroke={2.5} />;
    }
    if (showDownArrow) {
      return <IconArrowDown size={hero ? 20 : 16} stroke={2.5} />;
    }
    return <IconMinus size={hero ? 20 : 16} stroke={2.5} />;
  };

  const trendColor = getTrendColor();

  return (
    <div>
      {/* Label */}
      <p
        className={`tw:font-medium tw:text-gray-500 tw:uppercase tw:tracking-widest ${hero ? 'tw:text-sm' : 'tw:text-xs'}`}
      >
        {label}
      </p>

      {/* Value with trend indicator */}
      <div className="tw:flex tw:items-center tw:gap-sm tw:mt-xs">
        {trend !== 'neutral' && (
          <div
            className={`tw:flex tw:items-center tw:justify-center tw:rounded-full ${hero ? 'tw:w-8 tw:h-8' : 'tw:w-6 tw:h-6'}`}
            style={{
              backgroundColor:
                trend === 'positive' ? `${colors.primary[100]}` : `${colors.gray[100]}`,
              color: trend === 'positive' ? colors.primary[600] : colors.gray[600],
            }}
          >
            {getTrendIcon()}
          </div>
        )}
        <span
          className="tw:font-bold"
          style={{
            color: trendColor,
            fontSize: hero ? '2.5rem' : '1.75rem',
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
          }}
        >
          {value}
        </span>
      </div>

      {/* Subtext */}
      {subtext && <p className="tw:text-sm tw:text-gray-500 tw:mt-xs">{subtext}</p>}

      {/* Description */}
      {description && (
        <p className="tw:text-xs tw:text-gray-400 tw:mt-sm" style={{ lineHeight: 1.5 }}>
          {description}
        </p>
      )}
    </div>
  );
}

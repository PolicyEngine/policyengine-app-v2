import { useState } from 'react';
import { IconChevronDown, IconChevronRight, IconWallet } from '@tabler/icons-react';
import { useSelector } from 'react-redux';
import HouseholdBreakdown from '@/components/household/HouseholdBreakdown';
import MetricCard from '@/components/report/MetricCard';
import { Group, Stack, Text } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import { RootState } from '@/store';
import { Household } from '@/types/ingredients/Household';
import { calculateVariableComparison } from '@/utils/householdComparison';
import { formatVariableValue } from '@/utils/householdValues';

interface HouseholdOverviewProps {
  outputs: Household[];
  policyLabels?: string[];
}

// Fixed size for icon container to ensure square aspect ratio
const HERO_ICON_SIZE = 48;

/**
 * Overview page for household reports
 *
 * Features:
 * - Hero metric showing net income (or change)
 * - Clean expandable breakdown section
 * - Clear visual indicators for positive/negative changes
 */
export default function HouseholdOverview({ outputs, policyLabels }: HouseholdOverviewProps) {
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const metadata = useSelector((state: RootState) => state.metadata);

  const rootVariable = metadata.variables.household_net_income;
  if (!rootVariable) {
    return (
      <div>
        <Text style={{ color: 'red' }}>Error: household_net_income variable not found in metadata</Text>
      </div>
    );
  }

  // Determine mode and extract households
  const isComparisonMode = outputs.length === 2;
  const baseline = outputs[0];
  const reform = isComparisonMode ? outputs[1] : null;

  // Calculate comparison for net income
  const comparison = calculateVariableComparison(
    'household_net_income',
    baseline,
    reform,
    metadata
  );

  // Format the value
  const formattedValue = formatVariableValue(rootVariable, comparison.displayValue, 0);

  // Get policy labels
  const baselineLabel = policyLabels?.[0] || 'baseline';
  const reformLabel = policyLabels?.[1] || 'reform';

  // Determine trend
  const trend =
    comparison.direction === 'increase'
      ? 'positive'
      : comparison.direction === 'decrease'
        ? 'negative'
        : 'neutral';

  // Build display text
  let heroLabel: string;
  let heroSubtext: string;

  if (!isComparisonMode) {
    heroLabel = 'Your Net Income';
    heroSubtext = 'Total household income after taxes and benefits';
  } else if (comparison.direction === 'no-change') {
    heroLabel = 'Net Income Change';
    heroSubtext = `No change under "${reformLabel}" compared to "${baselineLabel}"`;
  } else {
    heroLabel = 'Net Income Change';
    const direction = comparison.direction === 'increase' ? 'increase' : 'decrease';
    heroSubtext = `${direction.charAt(0).toUpperCase() + direction.slice(1)} under "${reformLabel}" compared to "${baselineLabel}"`;
  }

  // Determine border color for breakdown
  const borderColor = isComparisonMode
    ? comparison.direction === 'increase'
      ? colors.primary[700]
      : colors.text.secondary
    : colors.primary[700];

  return (
    <Stack className="tw:gap-xl">
      {/* Hero Section - Net Income */}
      <div
        className="tw:p-xl"
        style={{
          background: `linear-gradient(135deg, ${colors.primary[50]} 0%, ${colors.background.primary} 100%)`,
          borderRadius: spacing.radius.container,
          border: `1px solid ${colors.primary[100]}`,
        }}
      >
        <Group className="tw:gap-md tw:items-start">
          <div
            className="tw:flex tw:items-center tw:justify-center tw:shrink-0"
            style={{
              width: HERO_ICON_SIZE,
              height: HERO_ICON_SIZE,
              backgroundColor: colors.primary[100],
              borderRadius: spacing.radius.element,
            }}
          >
            <IconWallet size={28} color={colors.primary[700]} stroke={1.5} />
          </div>
          <div className="tw:flex-1">
            <MetricCard
              label={heroLabel}
              value={formattedValue}
              subtext={heroSubtext}
              trend={trend}
              hero
            />
          </div>
        </Group>
      </div>

      {/* Expandable Breakdown Section */}
      <div
        style={{
          backgroundColor: colors.background.primary,
          borderRadius: spacing.radius.container,
          border: `1px solid ${colors.border.light}`,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <button
          onClick={() => setBreakdownOpen(!breakdownOpen)}
          className="tw:bg-transparent tw:border-none tw:cursor-pointer tw:p-lg tw:w-full tw:block"
          style={{ transition: 'background-color 0.15s ease' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.gray[50];
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <Group className="tw:justify-between tw:items-center">
            <Group className="tw:gap-sm">
              {breakdownOpen ? (
                <IconChevronDown size={20} color={colors.text.secondary} />
              ) : (
                <IconChevronRight size={20} color={colors.text.secondary} />
              )}
              <Text style={{ fontWeight: typography.fontWeight.medium, color: colors.text.primary }}>
                Detailed breakdown
              </Text>
            </Group>
            <Text className="tw:text-sm" style={{ color: colors.text.tertiary }}>
              {breakdownOpen ? 'Click to collapse' : 'Click to expand'}
            </Text>
          </Group>
        </button>

        {/* Collapsible Content */}
        {breakdownOpen && (
          <div
            className="tw:px-lg tw:pb-lg"
            style={{ borderTop: `1px solid ${colors.border.light}` }}
          >
            <div
              className="tw:mt-md"
              style={{ borderLeft: `3px solid ${borderColor}` }}
            >
              <HouseholdBreakdown baseline={baseline} reform={reform} borderColor={borderColor} />
            </div>

            {/* Helper text */}
            <Text
              className="tw:text-xs tw:mt-md tw:text-center"
              style={{ color: colors.text.tertiary }}
            >
              Click on any item to see its detailed breakdown
            </Text>
          </div>
        )}
      </div>
    </Stack>
  );
}

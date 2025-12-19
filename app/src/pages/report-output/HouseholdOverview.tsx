import { useSelector } from 'react-redux';
import { Box, Collapse, Group, Stack, Text, UnstyledButton } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconChevronDown, IconChevronRight, IconWallet } from '@tabler/icons-react';
import HouseholdBreakdown from '@/components/household/HouseholdBreakdown';
import MetricCard from '@/components/report/MetricCard';
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
  const [breakdownOpen, { toggle: toggleBreakdown }] = useDisclosure(false);
  const metadata = useSelector((state: RootState) => state.metadata);

  const rootVariable = metadata.variables.household_net_income;
  if (!rootVariable) {
    return (
      <Box>
        <Text c="red">Error: household_net_income variable not found in metadata</Text>
      </Box>
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
    <Stack gap={spacing.xl}>
      {/* Hero Section - Net Income */}
      <Box
        p={spacing.xl}
        style={{
          background: `linear-gradient(135deg, ${colors.primary[50]} 0%, ${colors.background.primary} 100%)`,
          borderRadius: spacing.md,
          border: `1px solid ${colors.primary[100]}`,
        }}
      >
        <Group gap={spacing.md} align="flex-start">
          <Box
            style={{
              width: HERO_ICON_SIZE,
              height: HERO_ICON_SIZE,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.primary[100],
              borderRadius: spacing.sm,
              flexShrink: 0,
            }}
          >
            <IconWallet size={28} color={colors.primary[700]} stroke={1.5} />
          </Box>
          <Box style={{ flex: 1 }}>
            <MetricCard
              label={heroLabel}
              value={formattedValue}
              subtext={heroSubtext}
              trend={trend}
              hero
            />
          </Box>
        </Group>
      </Box>

      {/* Expandable Breakdown Section */}
      <Box
        style={{
          backgroundColor: colors.background.primary,
          borderRadius: spacing.md,
          border: `1px solid ${colors.border.light}`,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <UnstyledButton
          onClick={toggleBreakdown}
          p={spacing.lg}
          style={{
            width: '100%',
            display: 'block',
            transition: 'background-color 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.gray[50];
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <Group justify="space-between" align="center">
            <Group gap={spacing.sm}>
              {breakdownOpen ? (
                <IconChevronDown size={20} color={colors.text.secondary} />
              ) : (
                <IconChevronRight size={20} color={colors.text.secondary} />
              )}
              <Text fw={typography.fontWeight.medium} c={colors.text.primary}>
                Detailed breakdown
              </Text>
            </Group>
            <Text size="sm" c={colors.text.tertiary}>
              {breakdownOpen ? 'Click to collapse' : 'Click to expand'}
            </Text>
          </Group>
        </UnstyledButton>

        {/* Collapsible Content */}
        <Collapse in={breakdownOpen}>
          <Box
            px={spacing.lg}
            pb={spacing.lg}
            style={{
              borderTop: `1px solid ${colors.border.light}`,
            }}
          >
            <Box
              mt={spacing.md}
              style={{
                borderLeft: `3px solid ${borderColor}`,
              }}
            >
              <HouseholdBreakdown baseline={baseline} reform={reform} borderColor={borderColor} />
            </Box>

            {/* Helper text */}
            <Text size="xs" c={colors.text.tertiary} mt={spacing.md} ta="center">
              Click on any item to see its detailed breakdown
            </Text>
          </Box>
        </Collapse>
      </Box>
    </Stack>
  );
}

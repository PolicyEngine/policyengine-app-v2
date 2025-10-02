import { Box, Stack, Text, Group, ActionIcon } from '@mantine/core';
import { IconTriangleFilled, IconCirclePlus } from '@tabler/icons-react';
import { Household } from '@/types/ingredients/Household';
import { colors, spacing, typography } from '@/designTokens';

interface HouseholdOverviewProps {
  output: Household;
}

/**
 * Overview sub-page for household report outputs
 * Based on the v1 NetIncomeBreakdown.jsx component structure
 *
 * Structure:
 * - Title showing total net income at top
 * - Vertical list of income components with left border
 * - Each component shows: label + arrow + value + expand icon
 * - Up arrows (blue) for additions, down arrows (gray) for subtractions
 * - Description text at bottom
 *
 * This component shows hardcoded structure - logic will be implemented later
 */
export default function HouseholdOverview({ output }: HouseholdOverviewProps) {
  // Hardcoded demo values for now
  // TODO: Extract these from output.householdData
  const netIncome = 126927;
  const marketIncome = 160275;
  const benefits = 0;
  const refundableTaxCredits = 180;
  const totalTaxBeforeCredits = 33528;

  // Arrow component for additions (blue, pointing up)
  const UpArrow = () => (
    <IconTriangleFilled
      size={14}
      style={{
        color: colors.primary[700],
        transform: 'rotate(0deg)',
      }}
    />
  );

  // Arrow component for subtractions (gray, pointing down)
  const DownArrow = () => (
    <IconTriangleFilled
      size={14}
      style={{
        color: colors.text.secondary,
        transform: 'rotate(180deg)',
      }}
    />
  );

  // Component for a single income breakdown row
  const IncomeBreakdownRow = ({
    label,
    value,
    isAddition,
    isExpandable = true,
  }: {
    label: string;
    value: number;
    isAddition: boolean;
    isExpandable?: boolean;
  }) => {
    const Arrow = isAddition ? UpArrow : DownArrow;
    const valueColor = isAddition ? colors.primary[700] : colors.text.secondary;

    return (
      <Box
        p={spacing.md}
        style={{
          borderLeft: `3px solid ${isAddition ? colors.primary[700] : colors.text.secondary}`,
          paddingLeft: spacing.lg,
          cursor: isExpandable ? 'pointer' : 'default',
          transition: 'background-color 0.2s ease',
          ...(isExpandable && {
            ':hover': {
              backgroundColor: colors.gray[50],
            },
          }),
        }}
      >
        <Group justify="space-between" align="center">
          <Group gap={spacing.sm}>
            <Text size="md" fw={typography.fontWeight.normal} c={colors.text.secondary}>
              {label}
            </Text>
            <Arrow />
            <Text size="md" fw={typography.fontWeight.semibold} c={valueColor}>
              ${value.toLocaleString()}
            </Text>
          </Group>
          {isExpandable && (
            <ActionIcon variant="subtle" color="gray" size="sm">
              <IconCirclePlus size={20} />
            </ActionIcon>
          )}
        </Group>
      </Box>
    );
  };

  return (
    <Stack gap={spacing.xl}>
      {/* Summary Card */}
      <Box
        p={spacing.xl}
        style={{
          border: `1px solid ${colors.border.light}`,
          borderRadius: spacing.sm,
          backgroundColor: colors.background.primary,
        }}
      >
        <Stack gap={spacing.lg}>
          {/* Main Title */}
          <Box>
            <Text size="xl" fw={typography.fontWeight.semibold} c={colors.primary[700]}>
              Your net income is ${netIncome.toLocaleString()}
            </Text>
          </Box>

          {/* Breakdown List */}
          <Box
            style={{
              borderLeft: `3px solid ${colors.primary[700]}`,
            }}
          >
            <Stack gap={0}>
              <IncomeBreakdownRow
                label="Your market income is"
                value={marketIncome}
                isAddition={true}
                isExpandable={true}
              />

              <IncomeBreakdownRow
                label="Your benefits are"
                value={benefits}
                isAddition={true}
                isExpandable={false}
              />

              <IncomeBreakdownRow
                label="Your refundable tax credits are"
                value={refundableTaxCredits}
                isAddition={true}
                isExpandable={true}
              />

              <IncomeBreakdownRow
                label="Your total tax before refundable credits are"
                value={totalTaxBeforeCredits}
                isAddition={false}
                isExpandable={true}
              />
            </Stack>
          </Box>

          {/* Description */}
          <Box ta="center" mt={spacing.sm}>
            <Text size="sm" c={colors.text.secondary}>
              Here&apos;s how we calculated your household&apos;s net income. Click on a section to
              see the breakdown. Hover to see more details.
            </Text>
          </Box>
        </Stack>
      </Box>
    </Stack>
  );
}

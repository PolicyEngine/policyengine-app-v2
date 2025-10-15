import { Box, Stack, Text } from '@mantine/core';
import { EconomyReportOutput } from '@/api/economy';
import { colors, spacing } from '@/designTokens';
import { Geography } from '@/types/ingredients/Geography';
import {
  isUKEconomyOutput,
  extractConstituencyName,
  extractCountryName,
  getRegionKey,
} from '@/utils/constituencyUtils';

interface UKGeographicImpactProps {
  output: EconomyReportOutput;
  userGeography?: Geography | null;
}

/**
 * UK Geographic Impact sub-page for economy report outputs
 * This is temporary display component purely for debug purposes and will
 * be replaced with proper visualizations in future.
 */
export default function UKGeographicImpact({ output, userGeography }: UKGeographicImpactProps) {
  // Only render for UK economy outputs with constituency data
  if (!isUKEconomyOutput(output) || !output.constituency_impact) {
    return (
      <Box p={spacing.xl}>
        <Text variant="bodyText" c={colors.gray[600]}>
          Geographic impact data is not available for this report.
        </Text>
      </Box>
    );
  }

  // If no user geography selected, show message
  if (!userGeography) {
    return (
      <Box p={spacing.xl}>
        <Text variant="bodyText" c={colors.gray[600]}>
          No geographic region selected for this report.
        </Text>
      </Box>
    );
  }

  const userGeographyId = userGeography.geographyId;

  // Don't show for UK-wide selection
  if (!userGeographyId || userGeographyId === 'uk') {
    return (
      <Box p={spacing.xl}>
        <Text variant="bodyText" c={colors.gray[600]}>
          Geographic impact analysis is available when you select a specific region (country or
          constituency) rather than UK-wide.
        </Text>
      </Box>
    );
  }

  // Handle constituency selection
  const constituencyName = extractConstituencyName(userGeographyId);
  if (constituencyName) {
    const data = output.constituency_impact.by_constituency[constituencyName];

    if (!data) {
      return (
        <Box p={spacing.xl}>
          <Text variant="bodyText" c={colors.gray[600]}>
            Data for constituency "{constituencyName}" is not available in this report.
          </Text>
        </Box>
      );
    }

    return (
      <Stack gap={spacing.xl}>
        <Box
          p={spacing.xl}
          style={{
            border: `1px solid ${colors.border.light}`,
            borderRadius: spacing.sm,
          }}
        >
          <Text variant="displayTitle" mb={spacing.md}>
            Constituency Impact: {constituencyName}
          </Text>

          <Stack gap={spacing.md}>
            <Box>
              <Text variant="metricLabel" mb={spacing.xs}>
                Average Household Income Change
              </Text>
              <Text variant="metricValue" c={colors.primary[700]}>
                £{data.average_household_income_change.toFixed(2)}
              </Text>
            </Box>

            <Box>
              <Text variant="metricLabel" mb={spacing.xs}>
                Relative Change
              </Text>
              <Text variant="metricValue" c={colors.primary[700]}>
                {(data.relative_household_income_change * 100).toFixed(2)}%
              </Text>
            </Box>
          </Stack>
        </Box>
      </Stack>
    );
  }

  // Handle country selection
  const countryName = extractCountryName(userGeographyId);
  if (countryName) {
    const regionKey = getRegionKey(userGeographyId);

    if (!regionKey || !output.constituency_impact.outcomes_by_region) {
      return (
        <Box p={spacing.xl}>
          <Text variant="bodyText" c={colors.gray[600]}>
            Regional data is not available in this report.
          </Text>
        </Box>
      );
    }

    const regionData = output.constituency_impact.outcomes_by_region[
      regionKey as keyof typeof output.constituency_impact.outcomes_by_region
    ];

    if (!regionData) {
      return (
        <Box p={spacing.xl}>
          <Text variant="bodyText" c={colors.gray[600]}>
            Data for country "{countryName}" is not available in this report.
          </Text>
        </Box>
      );
    }

    const totalConstituencies = Object.values(regionData).reduce(
      (a: number, b: number) => a + b,
      0
    );

    return (
      <Stack gap={spacing.xl}>
        <Box
          p={spacing.xl}
          style={{
            border: `1px solid ${colors.border.light}`,
            borderRadius: spacing.sm,
          }}
        >
          <Text variant="displayTitle" mb={spacing.md} tt="capitalize">
            Country Impact: {countryName}
          </Text>

          <Stack gap={spacing.md}>
            <Box>
              <Text variant="metricLabel" mb={spacing.xs}>
                Total Constituencies Analyzed
              </Text>
              <Text variant="metricValue" c={colors.primary[700]}>
                {totalConstituencies}
              </Text>
            </Box>
          </Stack>
        </Box>
      </Stack>
    );
  }

  // Fallback for unknown geography format
  return (
    <Box p={spacing.xl}>
      <Text variant="bodyText" c={colors.gray[600]}>
        Unable to determine geographic region from selection.
      </Text>
    </Box>
  );
}

import { useState } from 'react';
import { Group, Select, Stack, Text } from '@mantine/core';
import { convertParametersToPolicyJson } from '@/adapters/conversionHelpers';
import { spacing } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useHouseholdVariation } from '@/hooks/useHouseholdVariation';
import { useHouseholdMetadataContext } from '@/hooks/useMetadata';
import { useReportYear } from '@/hooks/useReportYear';
import type { Household } from '@/types/ingredients/Household';
import type { Policy } from '@/types/ingredients/Policy';
import type { Simulation } from '@/types/ingredients/Simulation';
import type { UserPolicy } from '@/types/ingredients/UserPolicy';
import { getValueFromHousehold } from '@/utils/householdValues';
import LoadingPage from '../LoadingPage';
import BaselineAndReformChart from './BaselineAndReformChart';
import BaselineOnlyChart from './BaselineOnlyChart';

interface Props {
  baseline: Household;
  reform: Household | null;
  simulations: Simulation[];
  policies?: Policy[];
  userPolicies?: UserPolicy[];
  households?: Household[];
}

/**
 * Earnings Variation page
 * Shows how variables change across different employment income levels
 * Variable selector dropdown + chart with baseline/reform comparison
 */
export default function EarningsVariationSubPage({
  baseline,
  reform,
  simulations,
  policies,
  userPolicies: _userPolicies,
  households: _households,
}: Props) {
  const [selectedVariable, setSelectedVariable] = useState('household_net_income');
  const countryId = useCurrentCountry();
  const reportYear = useReportYear();
  const metadataContext = useHouseholdMetadataContext();

  // Early return if no report year available (shouldn't happen in report output context)
  if (!reportYear) {
    return (
      <Stack gap={spacing.md}>
        <Text c="red">Error: Report year not available</Text>
      </Stack>
    );
  }

  // Get policy data for variations
  const baselinePolicy = policies?.find((p) => p.id === simulations[0]?.policyId);
  const reformPolicy = simulations[1] && policies?.find((p) => p.id === simulations[1].policyId);

  // Convert policies to API format for calculate-full endpoint
  const baselinePolicyData = baselinePolicy
    ? convertParametersToPolicyJson(baselinePolicy.parameters || [])
    : {};
  const reformPolicyData = reformPolicy
    ? convertParametersToPolicyJson(reformPolicy.parameters || [])
    : {};

  // Fetch baseline variation
  const {
    data: baselineVariation,
    isLoading: baselineLoading,
    error: baselineError,
  } = useHouseholdVariation({
    householdId: simulations[0]?.populationId || 'baseline',
    policyId: simulations[0]?.policyId || 'baseline-policy',
    policyData: baselinePolicyData,
    year: reportYear,
    countryId,
    enabled: !!simulations[0]?.populationId && !!baselinePolicy,
  });

  // Fetch reform variation (if reform exists)
  const {
    data: reformVariation,
    isLoading: reformLoading,
    error: reformError,
  } = useHouseholdVariation({
    householdId: simulations[1]?.populationId || 'reform',
    policyId: simulations[1]?.policyId || 'reform-policy',
    policyData: reformPolicyData,
    year: reportYear,
    countryId,
    enabled: !!reform && !!simulations[1]?.populationId && !!reformPolicy,
  });

  // Show loading if either query is still loading
  const isLoading = baselineLoading || (reform && reformLoading);

  if (isLoading) {
    return <LoadingPage message="Loading earnings variation..." />;
  }

  if (baselineError) {
    return (
      <Stack gap={spacing.md}>
        <Text c="red">Error loading baseline variation: {baselineError.message}</Text>
      </Stack>
    );
  }

  if (reform && reformError) {
    return (
      <Stack gap={spacing.md}>
        <Text c="red">Error loading reform variation: {reformError.message}</Text>
      </Stack>
    );
  }

  // Verify baseline data exists and has required structure
  if (!baselineVariation || !baselineVariation.householdData?.people) {
    return (
      <Stack gap={spacing.md}>
        <Text c="red">No baseline variation data available</Text>
      </Stack>
    );
  }

  // If reform exists, verify reform data has required structure
  if (reform && reformVariation && !reformVariation.householdData?.people) {
    return (
      <Stack gap={spacing.md}>
        <Text c="red">Invalid reform variation data</Text>
      </Stack>
    );
  }

  // Build variable options (variables with array values in variation data)
  const variableOptions = Object.keys(metadataContext.variables)
    .filter((varName) => {
      const variable = metadataContext.variables[varName];
      // Exclude marginal_tax_rate (has its own page)
      if (!variable || varName === 'marginal_tax_rate') {
        return false;
      }

      // Check if baseline variation has array values for this variable
      const value = getValueFromHousehold(
        varName,
        reportYear,
        null,
        baselineVariation,
        metadataContext
      );
      return Array.isArray(value);
    })
    .map((varName) => ({
      value: varName,
      label: metadataContext.variables[varName]?.label || varName,
    }));

  return (
    <Stack gap={spacing.lg}>
      <Group align="flex-end" gap={spacing.md}>
        <Text fw={500} size="sm" style={{ whiteSpace: 'nowrap', paddingBottom: '8px' }}>
          Select variable to display:
        </Text>
        <Select
          placeholder="Choose a variable"
          data={variableOptions}
          value={selectedVariable}
          onChange={(value) => value && setSelectedVariable(value)}
          searchable
          style={{ flex: 1 }}
        />
      </Group>

      {reform && reformVariation ? (
        <BaselineAndReformChart
          baseline={baseline}
          baselineVariation={baselineVariation}
          reform={reform}
          reformVariation={reformVariation}
          variableName={selectedVariable}
          year={reportYear}
        />
      ) : (
        <BaselineOnlyChart
          baseline={baseline}
          baselineVariation={baselineVariation}
          variableName={selectedVariable}
          year={reportYear}
        />
      )}
    </Stack>
  );
}

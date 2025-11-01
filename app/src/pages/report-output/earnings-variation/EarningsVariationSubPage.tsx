import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Group, Select, Stack, Text } from '@mantine/core';
import { PolicyAdapter } from '@/adapters/PolicyAdapter';
import { CURRENT_YEAR } from '@/constants';
import { spacing } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useHouseholdVariation } from '@/hooks/useHouseholdVariation';
import type { RootState } from '@/store';
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
  const metadata = useSelector((state: RootState) => state.metadata);

  // Get policy data for variations
  const baselinePolicy = policies?.find((p) => p.id === simulations[0]?.policyId);
  const reformPolicy = simulations[1] && policies?.find((p) => p.id === simulations[1].policyId);

  // Convert policies to API format
  const baselinePolicyData = baselinePolicy
    ? PolicyAdapter.toCreationPayload(baselinePolicy).data
    : {};
  const reformPolicyData = reformPolicy ? PolicyAdapter.toCreationPayload(reformPolicy).data : {};

  // Fetch baseline variation
  const {
    data: baselineVariation,
    isLoading: baselineLoading,
    error: baselineError,
  } = useHouseholdVariation({
    householdId: simulations[0]?.populationId || 'baseline',
    policyId: simulations[0]?.policyId || 'baseline-policy',
    policyData: baselinePolicyData,
    year: CURRENT_YEAR,
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
    year: CURRENT_YEAR,
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

  // Build variable options (only non-input variables with array values)
  const variableOptions = Object.keys(metadata.variables)
    .filter((varName) => {
      const variable = metadata.variables[varName];
      // Exclude input variables and marginal_tax_rate (has its own page)
      if (!variable || variable.isInputVariable || varName === 'marginal_tax_rate') {
        return false;
      }

      // Check if baseline variation has array values for this variable
      const value = getValueFromHousehold(varName, CURRENT_YEAR, null, baselineVariation, metadata);
      return Array.isArray(value);
    })
    .map((varName) => ({
      value: varName,
      label: metadata.variables[varName]?.label || varName,
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
          year={CURRENT_YEAR}
        />
      ) : (
        <BaselineOnlyChart
          baseline={baseline}
          baselineVariation={baselineVariation}
          variableName={selectedVariable}
          year={CURRENT_YEAR}
        />
      )}
    </Stack>
  );
}

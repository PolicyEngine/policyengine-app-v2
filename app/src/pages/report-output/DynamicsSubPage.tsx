import { useSelector } from 'react-redux';
import { Box, Text } from '@mantine/core';
import { RootState } from '@/store';
import { Policy } from '@/types/ingredients/Policy';
import { UserPolicy } from '@/types/ingredients/UserPolicy';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import {
  determinePolicyColumns,
  extractPoliciesFromArray,
  getParameterValueFromPolicy,
  getCurrentLawParameterValue,
  hasCurrentLawPolicy,
  calculateColumnWidths,
} from '@/utils/policyTableHelpers';
import { buildColumnHeaderText } from '@/utils/policyColumnHeaders';
import ParameterTable from '@/components/report/ParameterTable';
import { colors, spacing } from '@/designTokens';

interface DynamicsSubPageProps {
  policies?: Policy[];
  userPolicies?: UserPolicy[];
  reportType: 'economy' | 'household';
}

/**
 * Filter parameters to only those in dynamics namespaces
 * US: gov.simulation
 * UK: gov.dynamic
 */
function filterDynamicsParameters(paramNames: string[], countryId: string): string[] {
  const dynamicsPrefix = countryId === 'us' ? 'gov.simulation' : 'gov.dynamic';
  return paramNames.filter(paramName => paramName.startsWith(dynamicsPrefix));
}

/**
 * Collect unique dynamics parameter names from policies
 */
function collectDynamicsParameterNames(policies: Policy[], countryId: string): string[] {
  const allParamNames = new Set<string>();
  policies.forEach((policy) => {
    policy.parameters?.forEach((param) => allParamNames.add(param.name));
  });
  const filtered = filterDynamicsParameters(Array.from(allParamNames), countryId);
  return filtered.sort();
}

/**
 * DynamicsSubPage - Displays dynamics (simulation configuration) parameters
 *
 * Shows parameters from gov.simulation (US) or gov.dynamic (UK) namespaces
 * in the same table format as PolicySubPage.
 */
export default function DynamicsSubPage({ policies, userPolicies }: DynamicsSubPageProps) {
  const countryId = useCurrentCountry();
  const parameters = useSelector((state: RootState) => state.metadata.parameters);
  const currentLawId = useSelector((state: RootState) => state.metadata.currentLawId);

  if (!policies || policies.length === 0) {
    return <div>No policy data available</div>;
  }

  // Extract baseline and reform from policies array
  const { baseline, reform } = extractPoliciesFromArray(policies);

  // Collect dynamics parameters only
  const paramList = collectDynamicsParameterNames(policies, countryId);

  // If no dynamics parameters, show empty state
  if (paramList.length === 0) {
    return (
      <div>
        <h2>Dynamics Information</h2>
        <Box
          style={{
            border: `1px solid ${colors.border.light}`,
            borderRadius: spacing.radius.lg,
            padding: spacing['2xl'],
            backgroundColor: colors.white,
            marginTop: spacing.xl,
            textAlign: 'center',
          }}
        >
          <Text size="sm" c={colors.text.secondary}>
            No custom dynamics configuration for this report.
          </Text>
        </Box>
      </div>
    );
  }

  // Determine if current law column is needed (none of the policies is current law)
  const needsCurrentLawColumn = !hasCurrentLawPolicy(policies, currentLawId);

  // Determine column structure with smart collapsing
  const columns = determinePolicyColumns(undefined, baseline, reform);

  // Calculate column width percentages (including current law column if needed)
  const totalValueColumns = columns.length + (needsCurrentLawColumn ? 1 : 0);
  const { labelColumnWidth, valueColumnWidth } = calculateColumnWidths(totalValueColumns);

  return (
    <div>
      <h2>Dynamics Information</h2>

      <ParameterTable
        parameterNames={paramList}
        parameters={parameters}
        columns={columns}
        needsCurrentLawColumn={needsCurrentLawColumn}
        labelColumnWidth={labelColumnWidth}
        valueColumnWidth={valueColumnWidth}
        renderColumnHeader={(column) => buildColumnHeaderText(column, userPolicies)}
        renderCurrentLawValue={(paramName) => getCurrentLawParameterValue(paramName, parameters)}
        renderColumnValue={(column, paramName) => {
          // For merged columns, just use the first policy since they're equal
          const policy = column.policies[0];
          return getParameterValueFromPolicy(policy, paramName, parameters);
        }}
      />
    </div>
  );
}

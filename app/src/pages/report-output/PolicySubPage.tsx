import { useSelector } from 'react-redux';
import ParameterTable from '@/components/report/ParameterTable';
import { RootState } from '@/store';
import { Policy } from '@/types/ingredients/Policy';
import { UserPolicy } from '@/types/ingredients/UserPolicy';
import { buildColumnHeaderText } from '@/utils/policyColumnHeaders';
import {
  calculateColumnWidths,
  collectUniqueParameterNames,
  determinePolicyColumns,
  extractPoliciesFromArray,
  getCurrentLawParameterValue,
  getParameterValueFromPolicy,
  hasCurrentLawPolicy,
} from '@/utils/policyTableHelpers';

interface PolicySubPageProps {
  policies?: Policy[];
  userPolicies?: UserPolicy[];
  reportType: 'economy' | 'household';
}

/**
 * PolicySubPage - Displays policy information in Design 4 table format
 *
 * Shows all policies side-by-side in a comparison table with smart column
 * collapsing when policies are identical. Displays all parameters across
 * all policies in a unified view.
 */
export default function PolicySubPage({ policies, userPolicies }: PolicySubPageProps) {
  const parameters = useSelector((state: RootState) => state.metadata.parameters);
  const currentLawId = useSelector((state: RootState) => state.metadata.currentLawId);

  if (!policies || policies.length === 0) {
    return <div>No policy data available</div>;
  }

  // Extract baseline and reform from policies array
  const { baseline, reform } = extractPoliciesFromArray(policies);

  // Determine if current law column is needed (none of the policies is current law)
  const needsCurrentLawColumn = !hasCurrentLawPolicy(policies, currentLawId);

  // Determine column structure with smart collapsing
  const columns = determinePolicyColumns(undefined, baseline, reform);

  // Collect all unique parameter names across all policies
  const paramList = collectUniqueParameterNames(policies);

  // Calculate column width percentages (including current law column if needed)
  const totalValueColumns = columns.length + (needsCurrentLawColumn ? 1 : 0);
  const { labelColumnWidth, valueColumnWidth } = calculateColumnWidths(totalValueColumns);

  return (
    <div>
      <h2>Policy Information</h2>

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

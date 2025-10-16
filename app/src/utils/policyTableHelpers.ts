import { Policy } from '@/types/ingredients/Policy';
import { ParameterMetadata } from '@/types/metadata/parameterMetadata';
import { PolicyColumn } from './policyComparison';

export { determinePolicyColumns } from './policyComparison';
export type { PolicyColumn } from './policyComparison';

/**
 * Extract baseline and reform policies from a policies array
 * Assumes policies array is [baseline, reform] for both economy and household reports
 */
export function extractPoliciesFromArray(policies: Policy[]): {
  baseline: Policy | undefined;
  reform: Policy | undefined;
} {
  return {
    baseline: policies[0],
    reform: policies[1],
  };
}

/**
 * Collect all unique parameter names across all policies and return sorted
 */
export function collectUniqueParameterNames(policies: Policy[]): string[] {
  const allParamNames = new Set<string>();
  policies.forEach((policy) => {
    policy.parameters?.forEach((param) => allParamNames.add(param.name));
  });
  return Array.from(allParamNames).sort();
}

/**
 * Get a formatted parameter value from a policy
 * Returns em dash if parameter not found or no values
 */
export function getParameterValueFromPolicy(
  policy: Policy | undefined,
  paramName: string,
  parameters: Record<string, ParameterMetadata>
): string {
  if (!policy) return '—';

  const param = policy.parameters?.find((p) => p.name === paramName);
  if (!param || !param.values || param.values.length === 0) return '—';

  const value = param.values[0].value;
  const metadata = parameters[paramName];
  const unit = metadata?.unit || '';

  return formatParameterValue(value, unit);
}

/**
 * Format a parameter value with appropriate unit formatting
 */
export function formatParameterValue(value: any, unit?: string): string {
  if (typeof value === 'number') {
    if (unit === '%') {
      return `${(value * 100).toFixed(1)}%`;
    }
    if (unit === 'currency-USD') {
      return `$${value.toLocaleString()}`;
    }
    return value.toLocaleString();
  }
  return String(value);
}

/**
 * Calculate column widths for table layout
 * Label column gets 45%, remaining width split among value columns
 */
export function calculateColumnWidths(numValueColumns: number): {
  labelColumnWidth: number;
  valueColumnWidth: number;
} {
  const labelColumnWidth = 45;
  const valueColumnWidth = (100 - labelColumnWidth) / numValueColumns;
  return { labelColumnWidth, valueColumnWidth };
}

import { getParamDefinitionDate } from '@/constants';
import { Policy } from '@/types/ingredients/Policy';
import { ParameterMetadata } from '@/types/metadata';
import { ValueIntervalCollection, ValuesList } from '@/types/subIngredients/valueInterval';

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
 * Get a formatted parameter value from a policy at a specific date
 * Returns em dash if parameter not found or no values
 * @param policy - The policy to query
 * @param paramName - The parameter name
 * @param parameters - Parameter metadata collection
 * @param date - ISO date string (YYYY-MM-DD) to query, defaults to current year via getParamDefinitionDate()
 */
export function getParameterValueFromPolicy(
  policy: Policy | undefined,
  paramName: string,
  parameters: Record<string, ParameterMetadata>,
  date: string = getParamDefinitionDate()
): string {
  if (!policy) {
    return '—';
  }

  const param = policy.parameters?.find((p) => p.name === paramName);
  if (!param || !param.values || param.values.length === 0) {
    return '—';
  }

  // Use ValueIntervalCollection to get value at specific date
  const intervalCollection = new ValueIntervalCollection(param.values);
  const value = intervalCollection.getValueAtDate(date);

  if (value === undefined) {
    return '—';
  }

  const metadata = parameters[paramName];
  const unit = metadata?.unit || '';

  return formatParameterValue(value, unit);
}

/**
 * Format a parameter value with appropriate unit formatting
 * Always uses 1 decimal place for consistency across all columns
 */
export function formatParameterValue(value: any, unit?: string): string {
  if (typeof value === 'number') {
    const DECIMAL_PRECISION = 1;

    if (unit === '/1') {
      const percentValue = value * 100;
      return `${percentValue.toFixed(DECIMAL_PRECISION)}%`;
    }
    if (unit === 'currency-USD') {
      return `$${value.toLocaleString('en-US', {
        minimumFractionDigits: DECIMAL_PRECISION,
        maximumFractionDigits: DECIMAL_PRECISION,
      })}`;
    }
    if (unit === 'currency-GBP') {
      return `£${value.toLocaleString('en-GB', {
        minimumFractionDigits: DECIMAL_PRECISION,
        maximumFractionDigits: DECIMAL_PRECISION,
      })}`;
    }
    return value.toLocaleString('en-US', {
      minimumFractionDigits: DECIMAL_PRECISION,
      maximumFractionDigits: DECIMAL_PRECISION,
    });
  }
  return String(value);
}

/**
 * Gets the current law parameter value for a given parameter on a specific date
 * @param paramName - The parameter identifier (e.g., "gov.hmrc.income_tax.rates.uk[0].rate")
 * @param parameters - The parameter metadata collection
 * @param date - ISO date string (YYYY-MM-DD) to query, defaults to current year via getParamDefinitionDate()
 * @param baselineValuesMap - Optional map of parameter IDs to fetched baseline values from V2 API
 * @returns Formatted string value or '—' if not found
 */
export function getCurrentLawParameterValue(
  paramName: string,
  parameters: Record<string, ParameterMetadata>,
  date: string = getParamDefinitionDate(),
  baselineValuesMap?: Record<string, ValuesList>
): string {
  const metadata = parameters[paramName];

  // If parameter doesn't exist in metadata, return dash
  if (!metadata) {
    return '—';
  }

  // Prefer fetched baseline values from V2 API (keyed by parameter ID)
  if (baselineValuesMap && metadata.id && baselineValuesMap[metadata.id]) {
    const fetchedValues = baselineValuesMap[metadata.id];
    if (Object.keys(fetchedValues).length > 0) {
      const intervalCollection = new ValueIntervalCollection(fetchedValues);
      const value = intervalCollection.getValueAtDate(date);
      if (value !== undefined) {
        const unit = metadata.unit || '';
        return formatParameterValue(value, unit);
      }
    }
  }

  // Fall back to metadata values (backward compatibility)
  if (!metadata.values) {
    return '—';
  }

  // Create ValueIntervalCollection from the values list
  const intervalCollection = new ValueIntervalCollection(metadata.values);

  // Use getValueAtDate to find the value at the target date
  const value = intervalCollection.getValueAtDate(date);

  // If no matching value found, return dash
  if (value === undefined) {
    return '—';
  }

  // Format the value using existing formatter
  const unit = metadata.unit || '';
  return formatParameterValue(value, unit);
}

/**
 * Checks if any policy in the list is the current law policy.
 * In V2 API, current law is represented by policy_id = null.
 * @param policies - Array of policies to check
 * @param _currentLawId - Unused (kept for API compatibility), current law is always null
 * @returns True if any policy has id === null (current law)
 */
export function hasCurrentLawPolicy(policies: Policy[], _currentLawId: null): boolean {
  return policies.some((policy) => policy.id === null);
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

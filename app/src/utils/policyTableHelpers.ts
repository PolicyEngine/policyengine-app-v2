import { UNCONFIRMED_PARAM_DEFINITION_DATE } from '@/constants';
import { Policy } from '@/types/ingredients/Policy';
import { ParameterMetadata } from '@/types/metadata/parameterMetadata';
import { ValueIntervalCollection } from '@/types/subIngredients/valueInterval';
import { formatParameterValueFromMetadata, getCountryFromUnit } from './formatters';

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
 * @param date - ISO date string (YYYY-MM-DD) to query, defaults to UNCONFIRMED_PARAM_DEFINITION_DATE
 */
export function getParameterValueFromPolicy(
  policy: Policy | undefined,
  paramName: string,
  parameters: Record<string, ParameterMetadata>,
  date: string = UNCONFIRMED_PARAM_DEFINITION_DATE
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

  // Use the canonical parameter formatter with metadata lookup
  // This automatically determines unit, country, and appropriate precision
  const countryId = getCountryFromUnit(parameters[paramName]?.unit) || 'us';

  // Auto-detect precision based on value type and unit
  const unit = parameters[paramName]?.unit;
  let decimalPlaces: number;
  if (typeof value === 'number') {
    if (unit === '/1') {
      // Percentage: check if value * 100 is an integer
      const percentageValue = value * 100;
      decimalPlaces = Number.isInteger(percentageValue) ? 0 : 1;
    } else {
      // Currency/numeric: check if raw value is an integer
      decimalPlaces = Number.isInteger(value) ? 0 : 1;
    }
  } else {
    decimalPlaces = 1;
  }

  return formatParameterValueFromMetadata(paramName, value, parameters, countryId, { decimalPlaces });
}

/**
 * Gets the current law parameter value for a given parameter on a specific date
 * @param paramName - The parameter identifier (e.g., "gov.hmrc.income_tax.rates.uk[0].rate")
 * @param parameters - The parameter metadata collection
 * @param date - ISO date string (YYYY-MM-DD) to query, defaults to UNCONFIRMED_PARAM_DEFINITION_DATE
 * @returns Formatted string value or '—' if not found
 */
export function getCurrentLawParameterValue(
  paramName: string,
  parameters: Record<string, ParameterMetadata>,
  date: string = UNCONFIRMED_PARAM_DEFINITION_DATE
): string {
  const metadata = parameters[paramName];

  // If parameter doesn't exist in metadata, return dash
  if (!metadata) {
    return '—';
  }

  // If no values defined, return dash
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

  // Use the canonical parameter formatter with metadata lookup
  // This automatically determines unit, country, and appropriate precision
  const countryId = getCountryFromUnit(metadata.unit) || 'us';

  // Auto-detect precision based on value type and unit
  const unit = metadata.unit;
  let decimalPlaces: number;
  if (typeof value === 'number') {
    if (unit === '/1') {
      // Percentage: check if value * 100 is an integer
      const percentageValue = value * 100;
      decimalPlaces = Number.isInteger(percentageValue) ? 0 : 1;
    } else {
      // Currency/numeric: check if raw value is an integer
      decimalPlaces = Number.isInteger(value) ? 0 : 1;
    }
  } else {
    decimalPlaces = 1;
  }

  return formatParameterValueFromMetadata(paramName, value, parameters, countryId, { decimalPlaces });
}

/**
 * Checks if any policy in the list is the current law policy
 * @param policies - Array of policies to check
 * @param currentLawId - The ID that represents current law (from metadata)
 * @returns True if any policy matches current law ID
 */
export function hasCurrentLawPolicy(policies: Policy[], currentLawId: number): boolean {
  // Convert numeric current law ID to string for comparison with policy IDs (which are strings)
  const currentLawIdString = String(currentLawId);
  return policies.some((policy) => policy.id === currentLawIdString);
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

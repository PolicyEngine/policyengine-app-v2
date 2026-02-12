import { V2PolicyCreatePayload, V2PolicyParameterValue, V2PolicyResponse } from '@/api/policy';
import { Policy } from '@/types/ingredients/Policy';
import { ParameterMetadata } from '@/types/metadata';
import { PolicyMetadata } from '@/types/metadata/policyMetadata';
import { PolicyCreationPayload } from '@/types/payloads';
import { convertParametersToPolicyJson, convertPolicyJsonToParameters } from './conversionHelpers';

/**
 * Adapter for converting between Policy and API formats
 */
export class PolicyAdapter {
  /**
   * @deprecated Use fromV2Response for v2 API responses
   * Converts PolicyMetadata from API GET response to Policy type
   * Handles snake_case to camelCase conversion
   */
  static fromMetadata(metadata: PolicyMetadata): Policy {
    return {
      id: String(metadata.id),
      countryId: metadata.country_id,
      apiVersion: metadata.api_version,
      parameters: convertPolicyJsonToParameters(metadata.policy_json),
    };
  }

  /**
   * @deprecated Use toV2CreationPayload for v2 API
   * Converts Policy to format for API POST request (v1 format)
   */
  static toCreationPayload(policy: Policy): PolicyCreationPayload {
    return {
      data: convertParametersToPolicyJson(policy.parameters || []),
    };
  }

  /**
   * Converts V2 API response to Policy type
   */
  static fromV2Response(response: V2PolicyResponse): Policy {
    return {
      id: response.id,
      // Note: V2 response doesn't include parameter values directly
      // They would need to be fetched separately if needed
      parameters: [],
    };
  }

  /**
   * Converts Policy to V2 API creation payload
   *
   * @param policy - Policy with parameters (names and values)
   * @param parametersMetadata - Metadata record for name→ID lookup
   * @param taxBenefitModelId - UUID of the tax benefit model
   * @param name - Optional policy name (defaults to "Unnamed policy")
   * @param description - Optional policy description
   */
  static toV2CreationPayload(
    policy: Policy,
    parametersMetadata: Record<string, ParameterMetadata>,
    taxBenefitModelId: string,
    name?: string,
    description?: string
  ): V2PolicyCreatePayload {
    const parameterValues: V2PolicyParameterValue[] = [];

    for (const param of policy.parameters || []) {
      const parameterId = PolicyAdapter.getParameterIdByName(param.name, parametersMetadata);

      if (!parameterId) {
        console.warn(`Parameter ID not found for: ${param.name}`);
        continue;
      }

      // Convert each value interval to a V2 parameter value
      for (const interval of param.values) {
        const startDate = PolicyAdapter.toISOTimestamp(interval.startDate);
        // Skip if start_date would be null (shouldn't happen in practice)
        if (!startDate) {
          console.warn(`Invalid start date for parameter: ${param.name}`);
          continue;
        }

        parameterValues.push({
          parameter_id: parameterId,
          value_json: interval.value,
          start_date: startDate,
          end_date: PolicyAdapter.toISOTimestamp(interval.endDate),
        });
      }
    }

    return {
      name: name || 'Unnamed policy',
      description,
      tax_benefit_model_id: taxBenefitModelId,
      parameter_values: parameterValues,
    };
  }

  /**
   * Look up parameter ID by name from metadata
   */
  private static getParameterIdByName(
    paramName: string,
    parametersMetadata: Record<string, ParameterMetadata>
  ): string | null {
    // First try direct lookup by parameter path
    const param = parametersMetadata[paramName];
    if (param?.id) {
      return param.id;
    }

    // Also check by the 'parameter' field which might be the path
    for (const metadata of Object.values(parametersMetadata)) {
      if (metadata.parameter === paramName && metadata.id) {
        return metadata.id;
      }
    }

    return null;
  }

  /**
   * Convert date string (YYYY-MM-DD) to ISO timestamp (YYYY-MM-DDTHH:MM:SSZ)
   * Returns null for "forever" dates (9999-12-31 or 2100-12-31)
   */
  private static toISOTimestamp(dateStr: string): string | null {
    // Treat far-future dates as "indefinite" (null in v2 API)
    if (dateStr === '9999-12-31' || dateStr === '2100-12-31') {
      return null;
    }

    // Convert YYYY-MM-DD to ISO timestamp at midnight UTC
    return `${dateStr}T00:00:00Z`;
  }
}

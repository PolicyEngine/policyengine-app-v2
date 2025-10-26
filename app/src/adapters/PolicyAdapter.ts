import { Policy } from '@/types/ingredients/Policy';
import { PolicyMetadata } from '@/types/metadata/policyMetadata';
import { PolicyCreationPayload } from '@/types/payloads';
import { convertParametersToPolicyJson, convertPolicyJsonToParameters } from './conversionHelpers';

/**
 * Adapter for converting between Policy and API formats
 */
export class PolicyAdapter {
  /**
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
   * Converts Policy to format for API POST request
   * Note: API expects snake_case, but we handle that at the API layer
   */
  static toCreationPayload(policy: Policy): PolicyCreationPayload {
    return {
      data: convertParametersToPolicyJson(policy.parameters || []),
    };
  }
}

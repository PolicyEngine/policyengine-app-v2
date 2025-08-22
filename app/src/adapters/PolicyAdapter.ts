import { Policy } from '@/types/ingredients';
import { PolicyMetadata, PolicyMetadataParams } from '@/types/metadata/policyMetadata';
import { convertPolicyJsonToParameters, convertParametersToPolicyJson } from './conversionHelpers';

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
      id: metadata.id,
      countryId: metadata.country_id,
      apiVersion: metadata.api_version,
      parameters: convertPolicyJsonToParameters(metadata.policy_json),
    };
  }
  
  /**
   * Converts Policy to format for API POST request
   * Note: API expects snake_case, but we handle that at the API layer
   */
  static toCreationPayload(policy: Policy, label?: string): PolicyCreationPayload {
    return {
      label,
      data: convertParametersToPolicyJson(policy.parameters),
    };
  }
}

export interface PolicyCreationPayload {
  label?: string;
  data: PolicyMetadataParams;
}
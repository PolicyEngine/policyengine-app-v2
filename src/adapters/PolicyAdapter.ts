import { Policy } from '@/types/ingredients';
import { PolicyMetadata, PolicyMetadataParams } from '@/types/policyMetadata';
import { convertPolicyJsonToParameters, convertParametersToPolicyJson } from './conversionHelpers';

/**
 * Adapter for converting between Policy and API formats
 */
export class PolicyAdapter {
  /**
   * Converts PolicyMetadata from API GET response to Policy type
   */
  static fromMetadata(metadata: PolicyMetadata): Policy {
    return {
      id: metadata.id,
      country_id: metadata.country_id,
      api_version: metadata.api_version,
      parameters: convertPolicyJsonToParameters(metadata.policy_json),
    };
  }
  
  /**
   * Converts Policy to format for API POST request
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
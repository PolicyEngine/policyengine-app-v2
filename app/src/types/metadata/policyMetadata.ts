import { countryIds } from '@/libs/countries';

export interface PolicyMetadata {
  id: string;
  country_id: (typeof countryIds)[number];
  label?: string;
  api_version: string;
  policy_json: PolicyMetadataParams;
  policy_hash: string;
  /**
   * The parameters this policy sets that the current model no longer has.
   * Null when the API could not check, and absent from APIs that do not
   * report it; either way nothing is known to be missing.
   */
  missing_parameters?: string[] | null;
}

/** What v3 reads of a v1 policy: its changes, and those the model no longer has. */
export type V1PolicyContent = Pick<PolicyMetadata, 'policy_json' | 'missing_parameters'>;

export interface PolicyMetadataParams {
  [param: string]: PolicyMetadataParamValues;
}

export interface PolicyMetadataParamValues {
  [dateRange: string]: unknown;
}

export type PolicyParameterValue =
  | string
  | number
  | boolean
  | null
  | PolicyParameterValue[]
  | { [key: string]: PolicyParameterValue };

export type PolicyInputValue = number | boolean;

export interface SerializedPolicyMetadataParams {
  [param: string]: SerializedPolicyMetadataParamValues;
}

export interface SerializedPolicyMetadataParamValues {
  [dateRange: string]: PolicyParameterValue;
}

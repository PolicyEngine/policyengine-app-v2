import { countryIds } from '@/libs/countries';

export interface PolicyMetadata {
  id: string;
  country_id: (typeof countryIds)[number];
  label?: string;
  api_version: string;
  policy_json: PolicyMetadataParams;
  policy_hash: string;
}

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

import { countryIds } from '@/libs/countries';

export interface PolicyMetadata {
  id: Number;
  country_id: typeof countryIds[number];
  label?: string;
  api_version: string;
  policy_json: PolicyMetadataParams;
  policy_hash: string;
}

export interface PolicyMetadataParams {
  [param: string]: PolicyMetadataParamValues
}

export interface PolicyMetadataParamValues {
  [dateRange: string]: any;
}
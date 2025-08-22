import { PolicyMetadataParams, PolicyMetadataParamValues } from '@/types/metadata/policyMetadata';
import { Parameter } from '@/types/subIngredients/parameter';
import { ValueInterval } from '@/types/subIngredients/valueInterval';

/**
 * Converts PolicyMetadataParamValues (with "startDate.endDate" keys) into ValueInterval array
 * Copied from src/libs/policyParameterTransform.ts
 */
export function convertDateRangeMapToValueIntervals(
  paramValues: PolicyMetadataParamValues
): ValueInterval[] {
  return Object.entries(paramValues).map(([dateRange, value]) => {
    const [startDate, endDate] = dateRange.split('.');

    if (!startDate || !endDate) {
      throw new Error(
        `Invalid date range format: ${dateRange}. Expected format: "YYYY-MM-DD.YYYY-MM-DD"`
      );
    }

    return {
      startDate,
      endDate,
      value,
    };
  });
}

/**
 * Converts PolicyMetadata.policy_json into Parameter[] format
 * Copied from src/libs/policyParameterTransform.ts
 */
export function convertPolicyJsonToParameters(policyJson: PolicyMetadataParams): Parameter[] {
  return Object.entries(policyJson).map(([paramName, dateValueMap]) => {
    const valueIntervals = convertDateRangeMapToValueIntervals(dateValueMap);

    return {
      name: paramName,
      values: valueIntervals,
    };
  });
}

/**
 * Converts Parameter[] to PolicyMetadataParams format for API payloads
 * Based on src/types/policyPayloads.ts serializePolicyCreationPayload
 */
export function convertParametersToPolicyJson(parameters: Parameter[]): PolicyMetadataParams {
  const data: PolicyMetadataParams = {};

  parameters.forEach((param) => {
    data[param.name] = param.values.reduce((acc, cur) => {
      return { ...acc, [`${cur.startDate}.${cur.endDate}`]: cur.value };
    }, {});
  });

  return data;
}

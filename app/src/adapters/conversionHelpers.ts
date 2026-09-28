import { ReportOutput } from '@/types/ingredients/Report';
import type { ParameterMetadataCollection } from '@/types/metadata/parameterMetadata';
import {
  PolicyMetadataParams,
  PolicyMetadataParamValues,
  SerializedPolicyMetadataParams,
} from '@/types/metadata/policyMetadata';
import { Parameter } from '@/types/subIngredients/parameter';
import { ValueInterval } from '@/types/subIngredients/valueInterval';
import { coercePolicyParameterValue, resolvePolicyParameterValueSpec } from '@/utils/valueCoercion';

/**
 * Converts PolicyMetadataParamValues (with "startDate.endDate" keys) into ValueInterval array
 * Copied from src/libs/policyParameterTransform.ts
 */
export function convertDateRangeMapToValueIntervals(
  parameterName: string,
  paramValues: PolicyMetadataParamValues,
  parameterMetadata: ParameterMetadataCollection
): ValueInterval[] {
  const valueSpec = resolvePolicyParameterValueSpec(parameterName, parameterMetadata);
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
      value: coercePolicyParameterValue(value, valueSpec, parameterName),
    };
  });
}

/**
 * Converts PolicyMetadata.policy_json into Parameter[] format
 * Copied from src/libs/policyParameterTransform.ts
 */
export function convertPolicyJsonToParameters(
  policyJson: PolicyMetadataParams,
  parameterMetadata: ParameterMetadataCollection
): Parameter[] {
  return Object.entries(policyJson).map(([paramName, dateValueMap]) => {
    const valueIntervals = convertDateRangeMapToValueIntervals(
      paramName,
      dateValueMap,
      parameterMetadata
    );

    return {
      name: paramName,
      values: valueIntervals,
    };
  });
}

/**
 * Converts Parameter[] to PolicyMetadataParams format for API payloads
 */
export function convertParametersToPolicyJson(
  parameters: Parameter[],
  parameterMetadata: ParameterMetadataCollection
): SerializedPolicyMetadataParams {
  const data: SerializedPolicyMetadataParams = {};

  parameters.forEach((param) => {
    const valueSpec = resolvePolicyParameterValueSpec(param.name, parameterMetadata);
    data[param.name] = param.values.reduce(
      (acc, cur) => ({
        ...acc,
        [`${cur.startDate}.${cur.endDate}`]: coercePolicyParameterValue(
          cur.value,
          valueSpec,
          param.name
        ),
      }),
      {}
    );
  });

  return data;
}

/**
 * Serializer for ReportOutput to JSON string
 * TODO: Placeholder for custom serialization logic when report structure is finalized
 */
function reportOutputSerializer(_key: string, value: any): any {
  // Placeholder: currently performs default serialization
  return value;
}

/**
 * Deserializer for JSON string to ReportOutput
 * TODO: Placeholder for custom deserialization logic when report structure is finalized
 */
function reportOutputDeserializer(_key: string, value: any): any {
  // Placeholder: currently performs default deserialization
  return value;
}

/**
 * Converts ReportOutput to JSON string format for ReportMetadata
 */
export function convertReportOutputToJson(output: ReportOutput | null): string | null {
  if (output === null) {
    return null;
  }
  return JSON.stringify(output, reportOutputSerializer);
}

/**
 * Converts JSON string from ReportMetadata to ReportOutput format
 */
export function convertJsonToReportOutput(jsonString: string | null): ReportOutput | null {
  if (jsonString === null) {
    return null;
  }
  return JSON.parse(jsonString, reportOutputDeserializer);
}

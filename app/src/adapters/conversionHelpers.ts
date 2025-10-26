import { ReportOutput } from '@/types/ingredients/Report';

// Helper to detect Immer Proxy objects
function isProxy(obj: any): boolean {
  return obj != null && typeof obj === 'object' && obj.constructor?.name === 'DraftObject';
}
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
 */
export function convertParametersToPolicyJson(parameters: Parameter[]): PolicyMetadataParams {
  console.log('[ADAPTER] convertParametersToPolicyJson - START');
  console.log('[ADAPTER] parameters:', parameters);

  const data: PolicyMetadataParams = {};

  parameters.forEach((param, paramIndex) => {
    console.log(`[ADAPTER] Processing parameter ${paramIndex}:`, param);
    console.log(`[ADAPTER] param is Proxy?`, isProxy(param));
    console.log(`[ADAPTER] param.values:`, param.values);
    console.log(`[ADAPTER] param.values is Array?`, Array.isArray(param.values));

    if (param.values && param.values.length > 0) {
      console.log(`[ADAPTER] First value:`, param.values[0]);
      console.log(`[ADAPTER] First value is Proxy?`, isProxy(param.values[0]));
    }

    data[param.name] = param.values.reduce((acc, cur, valueIndex) => {
      console.log(`[ADAPTER]   Processing value ${valueIndex}:`, cur);
      console.log(`[ADAPTER]   cur is Proxy?`, isProxy(cur));
      return { ...acc, [`${cur.startDate}.${cur.endDate}`]: cur.value };
    }, {});
  });

  console.log('[ADAPTER] convertParametersToPolicyJson - END');
  console.log('[ADAPTER] Final data:', data);

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

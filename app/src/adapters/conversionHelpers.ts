import { ReportOutput } from '@/types/ingredients/Report';
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
 * Converts Parameter[] to PolicyMetadataParams format for API payloads
 */
export function convertParametersToPolicyJson(parameters: Parameter[]): PolicyMetadataParams {
  const data: PolicyMetadataParams = {};

  parameters.forEach((param) => {
    data[param.name] = param.values.reduce(
      (acc, cur) => ({ ...acc, [`${cur.startDate}.${cur.endDate}`]: cur.value }),
      {}
    );
  });

  return data;
}

/**
 * Converts JSON string from ReportMetadata to ReportOutput format.
 *
 * @deprecated Used only by the v1 report read path (ReportAdapter.fromMetadata).
 *
 * **Backward-compat note**: Users' existing v1 report outputs are stored as JSON
 * strings in the v1 API. This parser is needed to display them. Will be removed
 * once v1 API endpoints are decommissioned.
 */
export function convertJsonToReportOutput(jsonString: string | null): ReportOutput | null {
  if (jsonString === null) {
    return null;
  }
  return JSON.parse(jsonString);
}

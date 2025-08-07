import { PolicyMetadata, PolicyMetadataParamValues } from '@/types/policyMetadata';
import { Parameter } from '@/types/parameter';
import { ValueInterval } from '@/types/valueInterval';
import { addPolicyParam } from '@/reducers/policyReducer';
import { Dispatch } from '@reduxjs/toolkit';

/**
 * Converts PolicyMetadataParamValues (with "startDate.endDate" keys) into ValueInterval array
 * @param paramValues - Object with keys in "YYYY-MM-DD.YYYY-MM-DD" format and values
 * @returns Array of ValueInterval objects
 */
export function convertPolicyMetadataParamValuesToIntervals(paramValues: PolicyMetadataParamValues): ValueInterval[] {
  return Object.entries(paramValues).map(([dateRange, value]) => {
    // Parse the "startDate.endDate" format
    const [startDate, endDate] = dateRange.split('.');
    
    if (!startDate || !endDate) {
      throw new Error(`Invalid date range format: ${dateRange}. Expected format: "YYYY-MM-DD.YYYY-MM-DD"`);
    }
    
    return {
      startDate,
      endDate,
      value
    };
  });
}

/**
 * Transforms PolicyMetadata.policy_json into Parameter[] format expected by the policy reducer
 */
export function transformPolicyJsonToParameters(policyJson: PolicyMetadata['policy_json']): Parameter[] {
  return Object.entries(policyJson).map(([paramName, dateValueMap]) => {
    // Convert the PolicyMetadataParamValues to ValueInterval array
    const valueIntervals = convertPolicyMetadataParamValuesToIntervals(dateValueMap);
    
    return {
      name: paramName,
      values: valueIntervals
    };
  });
}

/**
 * Bulk loads policy parameters from PolicyMetadata.policy_json into the Redux store
 * @param policyJson - The policy_json object from PolicyMetadata
 * @param dispatch - Redux dispatch function
 */
export function loadPolicyParametersToStore(
  policyJson: PolicyMetadata['policy_json'],
  dispatch: Dispatch
): void {
  const parameters = transformPolicyJsonToParameters(policyJson);
  
  parameters.forEach(param => {
    param.values.forEach(valueInterval => {
      dispatch(addPolicyParam({
        name: param.name,
        valueInterval
      }));
    });
  });
}
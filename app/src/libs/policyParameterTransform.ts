import { Dispatch } from '@reduxjs/toolkit';
import { addPolicyParam } from '@/reducers/policyReducer';
import { PolicyAdapter, convertPolicyJsonToParameters } from '@/adapters';
import { PolicyMetadata } from '@/types/policyMetadata';

/**
 * Bulk loads policy parameters from PolicyMetadata.policy_json into the Redux store
 * @param policyJson - The policy_json object from PolicyMetadata
 * @param dispatch - Redux dispatch function
 */
export function loadPolicyParametersToStore(
  policyJson: PolicyMetadata['policy_json'],
  dispatch: Dispatch
): void {
  const parameters = convertPolicyJsonToParameters(policyJson);

  parameters.forEach((param) => {
    param.values.forEach((valueInterval) => {
      dispatch(
        addPolicyParam({
          name: param.name,
          valueInterval,
        })
      );
    });
  });
}

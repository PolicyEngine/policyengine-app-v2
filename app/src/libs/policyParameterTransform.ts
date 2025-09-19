import { Dispatch } from '@reduxjs/toolkit';
import { convertPolicyJsonToParameters } from '@/adapters';
import { addPolicyParamAtPosition } from '@/reducers/policyReducer';
import { PolicyMetadata } from '@/types/metadata/policyMetadata';

/**
 * Bulk loads policy parameters from PolicyMetadata.policy_json into the Redux store
 * @param policyJson - The policy_json object from PolicyMetadata
 * @param dispatch - Redux dispatch function
 * @param position - The position (0 or 1) to load the parameters into
 */
export function loadPolicyParametersToStore(
  policyJson: PolicyMetadata['policy_json'],
  dispatch: Dispatch,
  position: 0 | 1
): void {
  const parameters = convertPolicyJsonToParameters(policyJson);

  parameters.forEach((param) => {
    param.values.forEach((valueInterval) => {
      dispatch(
        addPolicyParamAtPosition({
          position,
          name: param.name,
          valueInterval,
        })
      );
    });
  });
}

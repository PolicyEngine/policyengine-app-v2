import { useCallback } from 'react';
import { PolicyStateProps } from '@/types/pathwayState';
import { Parameter } from '@/types/subIngredients/parameter';

/**
 * Factory for creating reusable policy-related callbacks
 * Can be used across Report, Simulation, and Policy pathways
 *
 * @param setState - State setter function
 * @param policySelector - Function to extract policy from state
 * @param policyUpdater - Function to update policy in state
 * @param navigateToMode - Navigation function
 * @param returnMode - Mode to navigate to after completing policy operations
 */
export function createPolicyCallbacks<TState, TMode>(
  setState: React.Dispatch<React.SetStateAction<TState>>,
  policySelector: (state: TState) => PolicyStateProps,
  policyUpdater: (state: TState, policy: PolicyStateProps) => TState,
  navigateToMode: (mode: TMode) => void,
  returnMode: TMode
) {
  const updateLabel = useCallback((label: string) => {
    setState((prev) => {
      const policy = policySelector(prev);
      return policyUpdater(prev, { ...policy, label });
    });
  }, [setState, policySelector, policyUpdater]);

  const updatePolicy = useCallback((updatedPolicy: PolicyStateProps) => {
    setState((prev) => policyUpdater(prev, updatedPolicy));
  }, [setState, policyUpdater]);

  const handleSelectCurrentLaw = useCallback((currentLawId: number, label: string = 'Current law') => {
    setState((prev) => policyUpdater(prev, {
      id: currentLawId.toString(),
      label,
      parameters: [],
      isCreated: true,
    }));
    navigateToMode(returnMode);
  }, [setState, policyUpdater, navigateToMode, returnMode]);

  const handleSelectExisting = useCallback((policyId: string, label: string, parameters: Parameter[]) => {
    setState((prev) => policyUpdater(prev, {
      id: policyId,
      label,
      parameters,
      isCreated: true,
    }));
    navigateToMode(returnMode);
  }, [setState, policyUpdater, navigateToMode, returnMode]);

  const handleSubmitSuccess = useCallback((policyId: string) => {
    setState((prev) => {
      const policy = policySelector(prev);
      return policyUpdater(prev, {
        ...policy,
        id: policyId,
        isCreated: true
      });
    });
    navigateToMode(returnMode);
  }, [setState, policySelector, policyUpdater, navigateToMode, returnMode]);

  return {
    updateLabel,
    updatePolicy,
    handleSelectCurrentLaw,
    handleSelectExisting,
    handleSubmitSuccess,
  };
}

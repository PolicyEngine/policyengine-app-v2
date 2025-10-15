import { useDispatch, useSelector } from 'react-redux';
import { navigateToPreviousFrame, returnFromFlow } from '@/reducers/flowReducer';
import type { RootState } from '@/store';

/**
 * Hook for managing back button functionality within flows.
 *
 * Returns:
 * - handleBack: Function to navigate to the previous frame or return from subflow
 * - canGoBack: Boolean indicating if there's a previous frame to go back to or a parent flow to return to
 *
 * Behavior:
 * - If frameHistory has entries: navigates to previous frame within current flow
 * - If frameHistory is empty but flowStack is not: returns from subflow to parent flow
 *
 * Usage:
 * const { handleBack, canGoBack } = useBackButton();
 *
 * {canGoBack && <Button onClick={handleBack}>Back</Button>}
 */
export const useBackButton = () => {
  const dispatch = useDispatch();
  const frameHistory = useSelector((state: RootState) => state.flow.frameHistory);
  const flowStack = useSelector((state: RootState) => state.flow.flowStack);

  // Can go back if there's frame history OR if we're in a subflow (can return to parent)
  const canGoBack = frameHistory.length > 0 || flowStack.length > 0;

  const handleBack = () => {
    if (frameHistory.length > 0) {
      // Navigate to previous frame within current flow
      dispatch(navigateToPreviousFrame());
    } else if (flowStack.length > 0) {
      // Return from subflow to parent flow
      dispatch(returnFromFlow());
    }
  };

  return { handleBack, canGoBack };
};

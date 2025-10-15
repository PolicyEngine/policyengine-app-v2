import { useDispatch, useSelector } from 'react-redux';
import { navigateToPreviousFrame } from '@/reducers/flowReducer';
import type { RootState } from '@/store';

/**
 * Hook for managing back button functionality within flows.
 *
 * Returns:
 * - handleBack: Function to navigate to the previous frame
 * - canGoBack: Boolean indicating if there's a previous frame to go back to
 *
 * Usage:
 * const { handleBack, canGoBack } = useBackButton();
 *
 * {canGoBack && <Button onClick={handleBack}>Back</Button>}
 */
export const useBackButton = () => {
  const dispatch = useDispatch();
  const frameHistory = useSelector((state: RootState) => state.flow.frameHistory);

  const canGoBack = frameHistory.length > 0;

  const handleBack = () => {
    if (canGoBack) {
      dispatch(navigateToPreviousFrame());
    }
  };

  return { handleBack, canGoBack };
};

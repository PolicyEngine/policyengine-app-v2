import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useIngredientReset } from './useIngredientReset';
import { selectCurrentPosition } from '@/reducers/activeSelectors';
import { clearFlow, returnFromFlow } from '@/reducers/flowReducer';
import { RootState } from '@/store';

export const useCancelFlow = (
  ingredientType: 'policy' | 'population' | 'simulation' | 'report'
) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Use existing ingredient reset hook
  const { resetIngredient, resetIngredientAtPosition } = useIngredientReset();

  // Get context
  const { flowStack } = useSelector((state: RootState) => state.flow);
  const currentPosition = useSelector(selectCurrentPosition);
  const countryId = useSelector((state: RootState) => state.metadata.currentCountry) || 'us';

  const handleCancel = () => {
    const isInSubflow = flowStack.length > 0;

    // Step 1: Clear ingredient state with cascading
    switch (ingredientType) {
      case 'policy':
        // Policy has no dependencies - clear at current position only
        resetIngredientAtPosition('policy', currentPosition);
        break;

      case 'population':
        // Population has no dependencies - clear at current position only
        resetIngredientAtPosition('population', currentPosition);
        break;

      case 'simulation':
        // Simulation depends on policy + population at current position
        // Clear simulation (which cascades to clear policies + populations at position)
        resetIngredientAtPosition('simulation', currentPosition);
        break;

      case 'report':
        // Report depends on everything - clear all positions
        resetIngredient('report');
        break;
    }

    // Step 2: Handle navigation based on context
    if (isInSubflow) {
      // In subflow: just pop back to parent
      dispatch(returnFromFlow());
    } else {
      // Standalone flow: clear flow and navigate away
      dispatch(clearFlow());
      const pluralIngredient = ingredientType === 'policy' ? 'policies' : `${ingredientType}s`;
      navigate(`/${countryId}/${pluralIngredient}`);
    }
  };

  return { handleCancel };
};

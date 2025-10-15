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
  const { resetIngredient, resetIngredientAtPosition, clearIngredientAtPosition } = useIngredientReset();

  // Get context
  const { flowStack } = useSelector((state: RootState) => state.flow);
  const currentPosition = useSelector(selectCurrentPosition);
  const countryId = useSelector((state: RootState) => state.metadata.currentCountry) || 'us';

  const handleCancel = () => {
    const isInSubflow = flowStack.length > 0;

    // Step 1: Clear ingredient state with cascading
    if (isInSubflow) {
      // In subflow: Clear ingredient data WITHOUT resetting mode/position
      // We're just backing out one level, still in the parent context
      switch (ingredientType) {
        case 'policy':
          clearIngredientAtPosition('policy', currentPosition);
          break;

        case 'population':
          clearIngredientAtPosition('population', currentPosition);
          break;

        case 'simulation':
          // Simulation cascades to clear policy + population at position
          clearIngredientAtPosition('simulation', currentPosition);
          break;

        case 'report':
          // Report clears everything including mode/position
          resetIngredient('report');
          break;
      }
    } else {
      // Standalone flow: Clear ingredient data AND reset mode/position
      switch (ingredientType) {
        case 'policy':
          resetIngredientAtPosition('policy', currentPosition);
          break;

        case 'population':
          resetIngredientAtPosition('population', currentPosition);
          break;

        case 'simulation':
          resetIngredientAtPosition('simulation', currentPosition);
          break;

        case 'report':
          resetIngredient('report');
          break;
      }
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

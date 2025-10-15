import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { clearFlow } from '@/reducers/flowReducer';
import { RootState } from '@/store';
import { useIngredientReset } from './useIngredientReset';

/**
 * Hook for managing cancel functionality in ingredient creation flows.
 *
 * Cancel is the "nuclear option" - it always:
 * - Clears ALL ingredient data (not just at current position)
 * - Exits ALL flows (clears entire flow stack)
 * - Navigates to the ingredient list page
 *
 * This is different from the Back button, which just navigates to the previous frame.
 *
 * Usage:
 * const { handleCancel } = useCancelFlow('policy');
 * <Button onClick={handleCancel}>Cancel</Button>
 */
export const useCancelFlow = (
  ingredientType: 'policy' | 'population' | 'simulation' | 'report'
) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Use existing ingredient reset hook
  const { resetIngredient } = useIngredientReset();

  // Get country for navigation
  const countryId = useSelector((state: RootState) => state.metadata.currentCountry) || 'us';

  const handleCancel = () => {
    // Step 1: Clear ALL ingredient data (nuclear option)
    switch (ingredientType) {
      case 'policy':
        resetIngredient('policy');
        break;

      case 'population':
        resetIngredient('population');
        break;

      case 'simulation':
        resetIngredient('simulation');
        break;

      case 'report':
        resetIngredient('report');
        break;
    }

    // Step 2: Exit ALL flows and navigate to list page
    dispatch(clearFlow());
    const pluralIngredient = ingredientType === 'policy' ? 'policies' : `${ingredientType}s`;
    navigate(`/${countryId}/${pluralIngredient}`);
  };

  return { handleCancel };
};

import { useDispatch } from 'react-redux';
import { clearAllPolicies } from '@/reducers/policyReducer';
import { clearAllPopulations } from '@/reducers/populationReducer';
import { clearReport } from '@/reducers/reportReducer';
import { clearAllSimulations } from '@/reducers/simulationsReducer';
import { AppDispatch } from '@/store';

export const ingredients = ['policy', 'simulation', 'population', 'report'];

export const useIngredientReset = () => {
  const dispatch = useDispatch<AppDispatch>();

  const resetIngredient = (ingredientName: (typeof ingredients)[number]) => {
    switch (ingredientName) {
      case 'policy':
        dispatch(clearAllPolicies());
        break;
      case 'simulation':
        dispatch(clearAllSimulations());
        dispatch(clearAllPolicies());
        dispatch(clearAllPopulations());
        break;
      case 'population':
        dispatch(clearAllPopulations());
        break;
      case 'report':
        dispatch(clearReport());
        dispatch(clearAllSimulations());
        dispatch(clearAllPolicies());
        dispatch(clearAllPopulations());
        break;
      default:
        console.error(`Unknown ingredient: ${ingredientName}`);
    }
  };

  const resetIngredients = (ingredientNames: (typeof ingredients)[number][]) => {
    // Sort by dependency order (most dependent first) to avoid redundant clears
    const dependencyOrder = ['report', 'simulation', 'policy', 'population'];
    const sortedIngredients = ingredientNames.sort(
      (a, b) => dependencyOrder.indexOf(b) - dependencyOrder.indexOf(a)
    );

    sortedIngredients.forEach((ingredient) => resetIngredient(ingredient));
  };

  return { resetIngredient, resetIngredients };
};

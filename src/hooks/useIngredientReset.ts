import { useDispatch } from 'react-redux';
import { clearPolicy } from '@/reducers/policyReducer';
import { clearSimulation } from '@/reducers/simulationReducer';
import { AppDispatch } from '@/store';

export const ingredients = ['policy', 'simulation', 'population', 'report'];

export const useIngredientReset = () => {
  const dispatch = useDispatch<AppDispatch>();

  const resetIngredient = (ingredientName: (typeof ingredients)[number]) => {
    switch (ingredientName) {
      case 'policy':
        dispatch(clearPolicy());
        break;
      case 'simulation':
        dispatch(clearSimulation());
        dispatch(clearPolicy()); // Clear dependency
        // TODO: Add population reset when population reducer is created
        break;
      case 'population':
        // TODO: Add when population reducer is created
        // dispatch(clearPopulation());
        break;
      case 'report':
        // TODO: Add when report reducer is created
        // dispatch(clearReport());
        dispatch(clearSimulation()); // Clear dependencies
        dispatch(clearPolicy());
        // TODO: Add population reset when population reducer is created
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

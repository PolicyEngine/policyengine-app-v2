import { useDispatch } from 'react-redux';
import { clearPopulation } from '@/reducers/populationReducer';
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
        dispatch(clearPolicy());
        dispatch(clearPopulation());
        break;
      case 'population':
        dispatch(clearPopulation());
        break;
      case 'report':
        dispatch(clearSimulation());
        dispatch(clearPolicy());
        dispatch(clearPopulation());
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

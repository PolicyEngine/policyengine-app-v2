import { useDispatch } from 'react-redux';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { clearAllPolicies, clearPolicyAtPosition } from '@/reducers/policyReducer';
import { clearAllPopulations, clearPopulationAtPosition } from '@/reducers/populationReducer';
import { clearReport, setActiveSimulationPosition, setMode } from '@/reducers/reportReducer';
import {
  clearAllSimulations,
  clearSimulationAtPosition,
} from '@/reducers/simulationsReducer';
import { AppDispatch } from '@/store';

export const ingredients = ['policy', 'simulation', 'population', 'report'];

export const useIngredientReset = () => {
  const dispatch = useDispatch<AppDispatch>();
  const countryId = useCurrentCountry();

  const resetIngredient = (ingredientName: (typeof ingredients)[number]) => {
    switch (ingredientName) {
      case 'policy':
        dispatch(clearAllPolicies());
        // Reset to standalone mode when clearing any ingredient
        dispatch(setMode('standalone'));
        dispatch(setActiveSimulationPosition(0));
        break;
      case 'simulation':
        dispatch(clearAllSimulations());
        dispatch(clearAllPolicies());
        dispatch(clearAllPopulations());
        // Reset to standalone mode when clearing simulations
        dispatch(setMode('standalone'));
        dispatch(setActiveSimulationPosition(0));
        break;
      case 'population':
        dispatch(clearAllPopulations());
        // Reset to standalone mode when clearing any ingredient
        dispatch(setMode('standalone'));
        dispatch(setActiveSimulationPosition(0));
        break;
      case 'report':
        dispatch(clearReport(countryId));
        dispatch(clearAllSimulations());
        dispatch(clearAllPolicies());
        dispatch(clearAllPopulations());
        // clearReport already resets mode and position, but let's be explicit
        // This ensures consistency even if clearReport changes in the future
        dispatch(setMode('standalone'));
        dispatch(setActiveSimulationPosition(0));
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

  const resetIngredientAtPosition = (
    ingredientName: 'policy' | 'population' | 'simulation',
    position: 0 | 1
  ) => {
    switch (ingredientName) {
      case 'policy':
        dispatch(clearPolicyAtPosition(position));
        // Reset to standalone mode when clearing any ingredient
        dispatch(setMode('standalone'));
        dispatch(setActiveSimulationPosition(0));
        break;
      case 'population':
        dispatch(clearPopulationAtPosition(position));
        // Reset to standalone mode when clearing any ingredient
        dispatch(setMode('standalone'));
        dispatch(setActiveSimulationPosition(0));
        break;
      case 'simulation':
        // Simulation depends on policy + population - cascade at position
        dispatch(clearSimulationAtPosition(position));
        dispatch(clearPolicyAtPosition(position));
        dispatch(clearPopulationAtPosition(position));
        // Reset to standalone mode when clearing any ingredient
        dispatch(setMode('standalone'));
        dispatch(setActiveSimulationPosition(0));
        break;
      default:
        console.error(`Position-aware reset not supported for: ${ingredientName}`);
    }
  };

  return { resetIngredient, resetIngredients, resetIngredientAtPosition };
};

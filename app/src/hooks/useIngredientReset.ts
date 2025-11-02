import { useDispatch } from 'react-redux';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { clearAllPolicies } from '@/reducers/policyReducer';
import { clearAllPopulations } from '@/reducers/populationReducer';
import { clearReport, setActiveSimulationPosition, setMode } from '@/reducers/reportReducer';
import { clearAllSimulations } from '@/reducers/simulationsReducer';
import { AppDispatch } from '@/store';

export const ingredients = ['policy', 'simulation', 'population', 'report'];

export const useIngredientReset = () => {
  const dispatch = useDispatch<AppDispatch>();
  const countryId = useCurrentCountry();

  const resetIngredient = (ingredientName: (typeof ingredients)[number]) => {
    console.log('[useIngredientReset] ========== RESET INGREDIENT ==========');
    console.log('[useIngredientReset] Ingredient:', ingredientName);
    console.log('[useIngredientReset] Country:', countryId);
    switch (ingredientName) {
      case 'policy':
        dispatch(clearAllPolicies());
        // Reset to standalone mode when clearing any ingredient
        dispatch(setMode('standalone'));
        dispatch(setActiveSimulationPosition(0));
        console.log('[useIngredientReset] Cleared policies');
        break;
      case 'simulation':
        dispatch(clearAllSimulations());
        dispatch(clearAllPolicies());
        dispatch(clearAllPopulations());
        // Reset to standalone mode when clearing simulations
        dispatch(setMode('standalone'));
        dispatch(setActiveSimulationPosition(0));
        console.log('[useIngredientReset] Cleared simulations, policies, populations');
        break;
      case 'population':
        dispatch(clearAllPopulations());
        // Reset to standalone mode when clearing any ingredient
        dispatch(setMode('standalone'));
        dispatch(setActiveSimulationPosition(0));
        console.log('[useIngredientReset] Cleared populations');
        break;
      case 'report':
        console.log('[useIngredientReset] Clearing report and all ingredients...');
        dispatch(clearReport(countryId));
        dispatch(clearAllSimulations());
        dispatch(clearAllPolicies());
        dispatch(clearAllPopulations());
        // clearReport already resets mode and position, but let's be explicit
        // This ensures consistency even if clearReport changes in the future
        dispatch(setMode('standalone'));
        dispatch(setActiveSimulationPosition(0));
        console.log('[useIngredientReset] Cleared report, simulations, policies, populations');
        break;
      default:
        console.error(`Unknown ingredient: ${ingredientName}`);
    }
    console.log('[useIngredientReset] ========== RESET COMPLETE ==========');
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

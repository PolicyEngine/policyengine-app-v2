import { Household } from '@/models/Household';
import type { ReportBuilderState } from '../types';

/** Clone editable state while retaining the Household model's immutable methods. */
export function cloneReportBuilderState(state: ReportBuilderState): ReportBuilderState {
  return {
    ...state,
    simulations: state.simulations.map((simulation) => {
      const cloned = structuredClone({
        ...simulation,
        population: { ...simulation.population, household: null },
      });
      return {
        ...cloned,
        population: {
          ...cloned.population,
          household: simulation.population.household
            ? Household.fromAppInput(simulation.population.household.toJSON())
            : null,
        },
      };
    }),
  };
}

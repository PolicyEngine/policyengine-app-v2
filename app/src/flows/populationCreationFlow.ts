import { Flow } from '../types/flow';

export const PopulationCreationFlow: Flow = {
  initialFrame: 'SelectGeographicScopeFrame',
  frames: {
    SelectGeographicScopeFrame: {
      component: 'SelectGeographicScopeFrame',
      on: {
        household: 'SetPopulationLabelFrame',
        state: 'SetPopulationLabelFrame',
        national: 'SetPopulationLabelFrame',
      },
    },
    SetPopulationLabelFrame: {
      component: 'SetPopulationLabelFrame',
      on: {
        household: 'HouseholdBuilderFrame',
        geographic: 'GeographicConfirmationFrame',
        back: 'SelectGeographicScopeFrame',
      },
    },
    HouseholdBuilderFrame: {
      component: 'HouseholdBuilderFrame',
      on: {
        next: '__return__',
        back: 'SetPopulationLabelFrame',
      },
    },
    GeographicConfirmationFrame: {
      component: 'GeographicConfirmationFrame',
      on: {
        next: '__return__',
        back: 'SetPopulationLabelFrame',
      },
    },
  },
};

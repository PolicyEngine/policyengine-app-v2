import { Flow } from '../types/flow';

export const PopulationCreationFlow: Flow = {
  initialFrame: 'SelectGeographicScopeFrame',
  frames: {
    SelectGeographicScopeFrame: {
      component: 'SelectGeographicScopeFrame',
      on: {
        household: 'HouseholdBuilderFrame',
        state: 'GeographicConfirmationFrame',
        national: 'GeographicConfirmationFrame',
      },
    },
    HouseholdBuilderFrame: {
      component: 'HouseholdBuilderFrame',
      on: {
        next: '__return__',
        back: 'SelectGeographicScopeFrame',
      },
    },
    GeographicConfirmationFrame: {
      component: 'GeographicConfirmationFrame',
      on: {
        next: '__return__',
        back: 'SelectGeographicScopeFrame',
      },
    },
  },
};

import { Flow } from '../types/flow';

export const PopulationFlow: Flow = {
  initialFrame: 'SelectGeographicScopeFrame',
  frames: {
    SelectGeographicScopeFrame: {
      component: 'SelectGeographicScopeFrame',
      on: {
        household: 'HouseholdBuilderFrame',
        state: '__return__',
        national: '__return__',
      },
    },
    HouseholdBuilderFrame: {
      component: 'HouseholdBuilderFrame',
      on: {
        next: '__return__',
        back: 'SelectGeographicScopeFrame',
      },
    },
  },
};

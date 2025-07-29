import { Flow } from '../types/flow';

export const PopulationFlow: Flow = {
  initialFrame: 'SelectGeographicScopeFrame',
  frames: {
    SelectGeographicScopeFrame: {
      component: 'SelectGeographicScopeFrame',
      on: {
        household: 'HouseholdBuilderFrame',
        state: 'StateScopeFrame', // if needed later
        national: 'NationalScopeFrame', // if needed later
      },
    },
    HouseholdBuilderFrame: {
      component: 'HouseholdBuilderFrame',
      on: {
        next: 'SimulationReturnFrame', // or go back to sim frame
        back: 'SelectGeographicScopeFrame',
      },
    },
  },
};

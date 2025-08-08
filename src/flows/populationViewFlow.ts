import { Flow } from '../types/flow';

export const PopulationViewFlow: Flow = {
  initialFrame: 'PopulationReadView',
  frames: {
    PopulationReadView: {
      component: 'PopulationReadView',
      on: {
        next: '__return__',
        // Optional: could add 'edit', 'delete', 'share' etc. here later
      },
    },
  },
};

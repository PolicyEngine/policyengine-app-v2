import { Flow } from '../types/flow';

export const PolicyViewFlow: Flow = {
  initialFrame: 'PolicyReadView',
  frames: {
    PolicyReadView: {
      component: 'PolicyReadView',
      on: {
        next: '__return__',
        // Optional: could add 'edit', 'delete', 'share' etc. here later
      },
    },
  },
};

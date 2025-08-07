import { Flow } from '../types/flow';

export const SimulationViewFlow: Flow = {
  initialFrame: 'SimulationReadView',
  frames: {
    SimulationReadView: {
      component: 'SimulationReadView',
      on: {
        next: '__return__',
      },
    },
  },
}; 
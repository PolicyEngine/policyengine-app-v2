import { Flow } from '../types/flow';

export const SimulationCreationFlow: Flow = {
  initialFrame: 'SimulationCreationFrame',
  frames: {
    SimulationCreationFrame: {
      component: 'SimulationCreationFrame',
      on: {
        next: 'SimulationSetupFrame',
      },
    },
    SimulationSetupFrame: {
      component: 'SimulationSetupFrame',
      on: {
        selectPolicy: 'PolicyCreationFlow',
        next: 'SimulationSubmitFrame',
      },
    },
    SimulationSubmitFrame: {
      component: 'SimulationSubmitFrame',
      on: {
        submit: '__return__',
      },
    },
  },
};

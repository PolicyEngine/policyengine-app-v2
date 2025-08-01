import SimulationSetupPolicyFrame from '@/frames/SimulationSetupPolicyFrame';
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
        setupPolicy: 'SimulationSetupPolicyFrame',
        setupPopulation: 'SimulationSetupPopulationFrame',
        next: 'SimulationSubmitFrame',
      },
    },
    SimulationSetupPolicyFrame: {
      component: 'SimulationSetupPolicyFrame',
      on: {
        createNew: 'PolicyCreationFlow',
      }
    },
    SimulationSubmitFrame: {
      component: 'SimulationSubmitFrame',
      on: {
        submit: '__return__',
      },
    },
  },
};

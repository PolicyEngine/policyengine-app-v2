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
        next: 'SetSimulationLabelFrame',
      },
    },
    SimulationSetupPolicyFrame: {
      component: 'SimulationSetupPolicyFrame',
      on: {
        createNew: {
          flow: 'PolicyCreationFlow',
          returnTo: 'SimulationSetupFrame',
        },
        loadExisting: 'SimulationSelectExistingPolicyFrame',
      },
    },
    SimulationSelectExistingPolicyFrame: {
      component: 'SimulationSelectExistingPolicyFrame',
      on: {
        next: 'SimulationSetupFrame',
      },
    },
    SimulationSetupPopulationFrame: {
      component: 'SimulationSetupPopulationFrame',
      on: {
        createNew: {
          flow: 'PopulationCreationFlow',
          returnTo: 'SimulationSetupFrame',
        },
        loadExisting: 'SimulationSelectExistingPopulationFrame',
      },
    },
    SimulationSelectExistingPopulationFrame: {
      component: 'SimulationSelectExistingPopulationFrame',
      on: {
        next: 'SimulationSetupFrame',
      },
    },
    SetSimulationLabelFrame: {
      component: 'SetSimulationLabelFrame',
      on: {
        next: 'SimulationSubmitFrame',
        back: 'SimulationSetupFrame',
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

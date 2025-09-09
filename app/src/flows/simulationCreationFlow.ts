import { Flow } from '../types/flow';

// @compat - TODO: after multi mode is stable, remove single mode and rename this back to SimulationSetupFrame
export const SimulationCreationFlow: Flow = {
  initialFrame: 'SimulationCreationFrame',
  frames: {
    SimulationCreationFrame: {
      component: 'SimulationCreationFrame',
      on: {
        // @compat - navigate to setup frame wrapper
        next: 'SimulationSetupFrameWrapper',
      },
    },
    // @compat - use the wrapper to choose the right version
    SimulationSetupFrameWrapper: {
      component: 'SimulationSetupFrameWrapper',
      on: {
        setupPolicy: 'SimulationSetupPolicyFrame',
        setupPopulation: 'SimulationSetupPopulationFrame',
        next: 'SimulationSubmitFrame',
      },
    },
    SimulationSetupPolicyFrame: {
      component: 'SimulationSetupPolicyFrame',
      on: {
        createNew: {
          flow: 'PolicyCreationFlow',
          returnTo: 'SimulationSetupFrameWrapper',
        },
        loadExisting: 'SimulationSelectExistingPolicyFrame',
      },
    },
    SimulationSelectExistingPolicyFrame: {
      component: 'SimulationSelectExistingPolicyFrame',
      on: {
        next: 'SimulationSetupFrameWrapper',
      },
    },
    SimulationSetupPopulationFrame: {
      component: 'SimulationSetupPopulationFrame',
      on: {
        createNew: {
          flow: 'PopulationCreationFlow',
          returnTo: 'SimulationSetupFrameWrapper',
        },
        loadExisting: 'SimulationSelectExistingPopulationFrame',
      },
    },
    SimulationSelectExistingPopulationFrame: {
      component: 'SimulationSelectExistingPopulationFrame',
      on: {
        next: 'SimulationSetupFrameWrapper',
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

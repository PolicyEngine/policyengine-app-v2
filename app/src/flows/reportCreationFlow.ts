import { Flow } from '../types/flow';

export const ReportCreationFlow: Flow = {
  initialFrame: 'ReportCreationFrame',
  frames: {
    ReportCreationFrame: {
      component: 'ReportCreationFrame',
      on: {
        next: 'ReportSetupFrame',
      },
    },
    ReportSetupFrame: {
      component: 'ReportSetupFrame',
      on: {
        setupSimulation1: 'ReportSelectSimulationFrame',
        setupSimulation2: 'ReportSelectSimulationFrame',
        next: 'ReportSubmitFrame',
      },
    },
    ReportSelectSimulationFrame: {
      component: 'ReportSelectSimulationFrame',
      on: {
        createNew: {
          flow: 'SimulationCreationFlow',
          returnTo: 'ReportSetupFrame',
        },
        loadExisting: 'ReportSelectExistingSimulationFrame',
      },
    },
    ReportSelectExistingSimulationFrame: {
      component: 'ReportSelectExistingSimulationFrame',
      on: {
        next: 'ReportSetupFrame',
      },
    },
    ReportSubmitFrame: {
      component: 'ReportSubmitFrame',
      on: {
        submit: '__return__', // Returns to parent flow after successful submission
      },
    },
  },
};

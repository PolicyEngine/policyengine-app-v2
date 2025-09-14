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
        next: '__return__', // Placeholder - will be updated later
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
  },
};

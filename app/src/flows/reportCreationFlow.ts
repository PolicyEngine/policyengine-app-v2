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
        next: '__return__', // Placeholder - will be updated later
      },
    },
  },
};

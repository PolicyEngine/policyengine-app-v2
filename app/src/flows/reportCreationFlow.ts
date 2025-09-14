import { Flow } from '../types/flow';

export const ReportCreationFlow: Flow = {
  initialFrame: 'ReportCreationFrame',
  frames: {
    ReportCreationFrame: {
      component: 'ReportCreationFrame',
      on: {
        next: '__return__', // Temporary - will expand to more frames later
      },
    },
  },
};

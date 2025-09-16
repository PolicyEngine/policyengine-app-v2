import { Flow } from '../types/flow';

export const ReportViewFlow: Flow = {
  initialFrame: 'ReportReadView',
  frames: {
    ReportReadView: {
      component: 'ReportReadView',
      on: {
        next: '__return__',
      },
    },
  },
};

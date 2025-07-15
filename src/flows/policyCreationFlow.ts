import { Flow } from '../types/flow';

export const PolicyCreationFlow: Flow = {
  initialFrame: 'PolicyCreationFrame',
  frames: {
    PolicyCreationFrame: {
      component: 'PolicyCreationFrame',
      on: {
        next: 'PolicyParameterSelectorFrame',
      },
    },
    PolicyParameterSelectorFrame: {
      component: 'PolicyParameterSelectorFrame',
      on: {
        next: 'PolicyTestView',
      },
    },
    PolicyTestView: {
      component: 'PolicyTestView',
      on: {
        next: '__return__',
      },
    },
  },
};

// TODO: Delete TestFlow and TestCompleteFlow once testing is complete
export const TestFlow: Flow = {
  initialFrame: 'TestView2',
  frames: {
    TestView2: {
      component: 'TestView2',
      on: {
        next: 'TestView3',
      },
    },
    TestView3: {
      component: 'TestView3',
      on: {
        next: '__return__',
      },
    },
  },
};

export const TestCompleteFlow: Flow = {
  initialFrame: 'TestCompleteView',
  frames: {
    TestCompleteView: {
      component: 'TestCompleteView',
      on: {
        next: 'PolicyCreationFlow',
      },
    },
  },
};

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
        next: 'SetPolicyLabelFrame',
      },
    },
    SetPolicyLabelFrame: {
      component: 'SetPolicyLabelFrame',
      on: {
        next: 'PolicySubmitFrame',
        back: 'PolicyParameterSelectorFrame',
      },
    },
    PolicySubmitFrame: {
      component: 'PolicySubmitFrame',
      on: {
        cancel: '__return__',
      },
    },
  },
};

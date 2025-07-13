import { Flow } from "./types";

export const PolicyCreationFlow: Flow = {
  initialFrame: "PolicyCreationView",
  frames: {
    PolicyCreationView: {
      component: "PolicyCreationView",
      on: {
        "next": "PolicyTestView"
      }
    },
    PolicyTestView: {
      component: "PolicyTestView",
      on: {
        "next": "__return__"
      }
    }
  }
};

// TODO: Delete TestFlow and TestCompleteFlow once testing is complete
export const TestFlow: Flow = {
  initialFrame: "TestView2",
  frames: {
    TestView2: {
      component: "TestView2",
      on: {
        "next": "TestView3"
      }
    },
    TestView3: {
      component: "TestView3",
      on: {
        "next": "__return__"
      }
    }
  },
}

export const TestCompleteFlow: Flow = {
  initialFrame: "TestCompleteView",
  frames: {
    TestCompleteView: {
      component: "TestCompleteView",
      on: {
        "next": "PolicyCreationFlow"
      }
    }
  },
}
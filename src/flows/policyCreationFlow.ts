import { Flow } from "./types";

export const policyCreationFlow: Flow = {
  name: "policyCreation",
  initialFrame: "PolicyCreationView",
  frames: [
    {
      name: "policyCreationView",
      component: "PolicyCreationView",
      nextButtonText: "Next",
    },
  ],
};